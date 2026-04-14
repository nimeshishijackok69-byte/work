CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: admin_profile
CREATE TABLE admin_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: event_master
CREATE TABLE event_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    form_schema JSONB DEFAULT '{"fields":[]}',
    review_layers INTEGER NOT NULL DEFAULT 1,
    scoring_type TEXT NOT NULL DEFAULT 'numeric',
    grade_config JSONB,
    max_score INTEGER DEFAULT 100,
    status TEXT NOT NULL DEFAULT 'draft',
    share_slug TEXT UNIQUE NOT NULL,
    max_file_size INTEGER DEFAULT 20971520,
    allowed_file_types TEXT[] DEFAULT '{}',
    expiration_date TIMESTAMPTZ,
    teacher_fields JSONB DEFAULT '["name","email","school_name"]',
    created_by UUID NOT NULL REFERENCES admin_profile(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_event_share_slug ON event_master(share_slug);
CREATE INDEX idx_event_status ON event_master(status);
CREATE INDEX idx_event_created_by ON event_master(created_by);

-- Table: user_master
CREATE TABLE user_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES event_master(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    school_name TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_event ON user_master(event_id);
CREATE INDEX idx_user_email_event ON user_master(email, event_id);

-- Table: submission
CREATE TABLE submission (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES event_master(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_master(id) ON DELETE CASCADE,
    form_data JSONB DEFAULT '{}',
    file_attachments JSONB DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'draft',
    submission_number INTEGER NOT NULL DEFAULT 1,
    current_layer INTEGER DEFAULT 0,
    review_status TEXT DEFAULT 'pending',
    eliminated_at_layer INTEGER,
    draft_token TEXT UNIQUE,
    draft_token_expires TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_submission_event ON submission(event_id);
CREATE INDEX idx_submission_user ON submission(user_id);
CREATE INDEX idx_submission_status ON submission(status);
CREATE INDEX idx_submission_event_status ON submission(event_id, status);
CREATE INDEX idx_submission_draft_token ON submission(draft_token) WHERE draft_token IS NOT NULL;
CREATE INDEX idx_submission_review_status ON submission(event_id, review_status, current_layer);

-- Table: reviewer_master
CREATE TABLE reviewer_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    department TEXT,
    specialization TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reviewer_auth_user ON reviewer_master(auth_user_id);
CREATE INDEX idx_reviewer_active ON reviewer_master(is_active);

-- Table: review_assignment
CREATE TABLE review_assignment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES event_master(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES submission(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES reviewer_master(id) ON DELETE CASCADE,
    layer INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    is_override BOOLEAN DEFAULT false,
    assigned_by UUID NOT NULL REFERENCES admin_profile(id),
    assigned_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    UNIQUE (submission_id, reviewer_id, layer)
);

CREATE INDEX idx_assignment_reviewer ON review_assignment(reviewer_id);
CREATE INDEX idx_assignment_event_layer ON review_assignment(event_id, layer);
CREATE INDEX idx_assignment_submission ON review_assignment(submission_id);
CREATE INDEX idx_assignment_status ON review_assignment(reviewer_id, status);

-- Table: review
CREATE TABLE review (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID UNIQUE NOT NULL REFERENCES review_assignment(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES event_master(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES submission(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES reviewer_master(id) ON DELETE CASCADE,
    layer INTEGER NOT NULL,
    score DECIMAL(5,2),
    grade TEXT,
    notes TEXT,
    reviewed_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_review_event ON review(event_id);
CREATE INDEX idx_review_submission ON review(submission_id);
CREATE INDEX idx_review_reviewer ON review(reviewer_id);
CREATE INDEX idx_review_submission_layer ON review(submission_id, layer);

-- Table: transaction_master
CREATE TABLE transaction_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES event_master(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES submission(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_master(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    actor_id UUID,
    actor_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transaction_event ON transaction_master(event_id);
CREATE INDEX idx_transaction_submission ON transaction_master(submission_id);
CREATE INDEX idx_transaction_action ON transaction_master(action);
CREATE INDEX idx_transaction_created ON transaction_master(created_at);

-- Table: notification
CREATE TABLE notification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL,
    recipient_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notification_recipient ON notification(recipient_id, recipient_type, is_read);
CREATE INDEX idx_notification_created ON notification(created_at);

-- Functions
CREATE OR REPLACE FUNCTION fn_generate_share_slug()
RETURNS TRIGGER AS $$
DECLARE
    new_slug TEXT;
    slug_exists BOOLEAN;
BEGIN
    LOOP
        new_slug := encode(gen_random_bytes(6), 'base64');
        new_slug := replace(replace(replace(new_slug, '/', ''), '+', ''), '=', '');
        new_slug := substring(new_slug, 1, 8);
        
        SELECT EXISTS(SELECT 1 FROM event_master WHERE share_slug = new_slug) INTO slug_exists;
        IF NOT slug_exists THEN
            NEW.share_slug := new_slug;
            EXIT;
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_master_share_slug_trigger
BEFORE INSERT ON event_master
FOR EACH ROW
WHEN (NEW.share_slug IS NULL)
EXECUTE FUNCTION fn_generate_share_slug();

CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_profile_update_timestamp BEFORE UPDATE ON admin_profile FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER event_master_update_timestamp BEFORE UPDATE ON event_master FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER submission_update_timestamp BEFORE UPDATE ON submission FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER reviewer_master_update_timestamp BEFORE UPDATE ON reviewer_master FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER review_update_timestamp BEFORE UPDATE ON review FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE OR REPLACE FUNCTION fn_log_transaction(
    p_event_id UUID,
    p_action TEXT,
    p_actor_id UUID,
    p_actor_type TEXT,
    p_submission_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
BEGIN
    INSERT INTO transaction_master (event_id, action, actor_id, actor_type, submission_id, user_id, metadata)
    VALUES (p_event_id, p_action, p_actor_id, p_actor_type, p_submission_id, p_user_id, p_metadata)
    RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- RLS setup (Enable RLS for all tables)
ALTER TABLE admin_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE review ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;

-- Note: RLS Policies for admin and reviewer 
CREATE POLICY "Admins can view their own profile" ON admin_profile FOR SELECT USING (auth_user_id = auth.uid());
CREATE POLICY "Admins can update their own profile" ON admin_profile FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Admins full CRUD on own events" ON event_master FOR ALL USING (created_by IN (SELECT id FROM admin_profile WHERE auth_user_id = auth.uid()));
CREATE POLICY "Reviewers SELECT on assigned events" ON event_master FOR SELECT USING (id IN (SELECT event_id FROM review_assignment WHERE reviewer_id IN (SELECT id FROM reviewer_master WHERE auth_user_id = auth.uid())));
CREATE POLICY "Public SELECT on published events" ON event_master FOR SELECT USING (status = 'published');

CREATE POLICY "Admins full SELECT on users for their events" ON user_master FOR SELECT USING (event_id IN (SELECT id FROM event_master WHERE created_by IN (SELECT id FROM admin_profile WHERE auth_user_id = auth.uid())));
CREATE POLICY "Public INSERT on form submission" ON user_master FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins full SELECT on submissions for their events" ON submission FOR SELECT USING (event_id IN (SELECT id FROM event_master WHERE created_by IN (SELECT id FROM admin_profile WHERE auth_user_id = auth.uid())));
CREATE POLICY "Reviewers SELECT on assigned submissions" ON submission FOR SELECT USING (id IN (SELECT submission_id FROM review_assignment WHERE reviewer_id IN (SELECT id FROM reviewer_master WHERE auth_user_id = auth.uid())));
CREATE POLICY "Public INSERT on form submission" ON submission FOR INSERT WITH CHECK (true);
CREATE POLICY "Public UPDATE on their own draft" ON submission FOR UPDATE USING (draft_token IS NOT NULL);

CREATE POLICY "Admins full CRUD on assignments for their events" ON review_assignment FOR ALL USING (event_id IN (SELECT id FROM event_master WHERE created_by IN (SELECT id FROM admin_profile WHERE auth_user_id = auth.uid())));
CREATE POLICY "Reviewers SELECT on their assignments" ON review_assignment FOR SELECT USING (reviewer_id IN (SELECT id FROM reviewer_master WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins SELECT on reviews for their events" ON review FOR SELECT USING (event_id IN (SELECT id FROM event_master WHERE created_by IN (SELECT id FROM admin_profile WHERE auth_user_id = auth.uid())));
CREATE POLICY "Reviewers INSERT their own reviews" ON review FOR INSERT WITH CHECK (reviewer_id IN (SELECT id FROM reviewer_master WHERE auth_user_id = auth.uid()));
CREATE POLICY "Reviewers UPDATE their own reviews" ON review FOR UPDATE USING (reviewer_id IN (SELECT id FROM reviewer_master WHERE auth_user_id = auth.uid()));
CREATE POLICY "Reviewers SELECT their own previous reviews" ON review FOR SELECT USING (reviewer_id IN (SELECT id FROM reviewer_master WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins SELECT on transactions for their events" ON transaction_master FOR SELECT USING (event_id IN (SELECT id FROM event_master WHERE created_by IN (SELECT id FROM admin_profile WHERE auth_user_id = auth.uid())));
CREATE POLICY "Service Role INSERT append only audit" ON transaction_master FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view and update their own notifications" ON notification FOR SELECT USING (recipient_id IN (SELECT id FROM admin_profile WHERE auth_user_id = auth.uid()) AND recipient_type = 'admin');
CREATE POLICY "Admins update their own notifications" ON notification FOR UPDATE USING (recipient_id IN (SELECT id FROM admin_profile WHERE auth_user_id = auth.uid()) AND recipient_type = 'admin');
CREATE POLICY "Reviewers can view and update their own notifications" ON notification FOR SELECT USING (recipient_id IN (SELECT id FROM reviewer_master WHERE auth_user_id = auth.uid()) AND recipient_type = 'reviewer');
CREATE POLICY "Reviewers update their own notifications" ON notification FOR UPDATE USING (recipient_id IN (SELECT id FROM reviewer_master WHERE auth_user_id = auth.uid()) AND recipient_type = 'reviewer');

import { resend } from '../resend';

export interface ReviewerAssignmentEmailProps {
  reviewerName: string;
  reviewerEmail: string;
  eventTitle: string;
  layerNumber: number;
  submissionCount: number;
  deadline?: string;
}

export async function sendReviewerAssignmentEmail({
  reviewerName,
  reviewerEmail,
  eventTitle,
  layerNumber,
  submissionCount,
  deadline,
}: ReviewerAssignmentEmailProps) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'FormFlow <noreply@formflow.com>',
      to: reviewerEmail,
      subject: `New Review Assignment - ${eventTitle} (Layer ${layerNumber})`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              .label { font-weight: 600; color: #555; }
              .value { color: #333; }
              .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">New Review Assignment</h1>
              </div>
              <div class="content">
                <p>Dear <strong>${reviewerName}</strong>,</p>
                <p>You have been assigned to review submissions for <strong>${eventTitle}</strong>.</p>
                
                <div class="info-box">
                  <p class="label">Review Layer:</p>
                  <p class="value">Layer ${layerNumber}</p>
                  
                  <p class="label" style="margin-top: 15px;">Submissions Assigned:</p>
                  <p class="value">${submissionCount} form(s)</p>
                  
                  ${deadline ? `
                  <p class="label" style="margin-top: 15px;">Deadline:</p>
                  <p class="value">${deadline}</p>
                  ` : ''}
                </div>
                
                <p>Please log in to your dashboard to begin reviewing the assigned submissions.</p>
                
                <a href="${process.env.NEXTAUTH_URL}/reviewer" class="cta-button">Go to Dashboard</a>
              </div>
              <div class="footer">
                <p>This is an automated email from FormFlow. Please do not reply.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Email] Failed to send reviewer assignment:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[Email] Error sending reviewer assignment:', error);
    return { success: false, error };
  }
}

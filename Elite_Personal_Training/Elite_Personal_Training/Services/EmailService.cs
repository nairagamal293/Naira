// Services/EmailService.cs
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace Elite_Personal_Training.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendPasswordResetEmailAsync(string email, string resetLink)
        {
            var subject = "Elite PT - Password Reset Request";
            var plainTextContent = $"Please reset your password using this link: {resetLink}";
            var htmlContent = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2 style='color: #9c0d0d;'>Elite Personal Training</h2>
                    <p>We received a request to reset your password.</p>
                    <p>Please click the button below to reset your password:</p>
                    <a href='{resetLink}' 
                       style='background-color: #9c0d0d; color: white; padding: 10px 20px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;'>
                        Reset Password
                    </a>
                    <p>If you didn't request this, please ignore this email.</p>
                    <p>This link will expire in 24 hours.</p>
                </div>";

            await SendEmailAsync(email, subject, plainTextContent, htmlContent);
        }

        public async Task SendWelcomeEmailAsync(string email, string name)
        {
            var subject = "Welcome to Elite Personal Training!";
            var plainTextContent = $"Welcome {name}! Thank you for joining Elite Personal Training.";
            var htmlContent = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2 style='color: #9c0d0d;'>Welcome to Elite Personal Training, {name}!</h2>
                    <p>We're excited to have you as part of our fitness community.</p>
                    <p>Get started by exploring our training programs and booking your first session.</p>
                    <p>If you have any questions, don't hesitate to contact our support team.</p>
                </div>";

            await SendEmailAsync(email, subject, plainTextContent, htmlContent);
        }

        public async Task SendBookingConfirmationAsync(string email, string bookingDetails)
        {
            var subject = "Your Elite PT Booking Confirmation";
            var plainTextContent = $"Your booking details:\n{bookingDetails}";
            var htmlContent = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2 style='color: #9c0d0d;'>Booking Confirmed!</h2>
                    <p>Here are your booking details:</p>
                    <div style='background-color: #f8f9fa; padding: 15px; border-radius: 5px;'>
                        {bookingDetails}
                    </div>
                    <p>We look forward to seeing you!</p>
                </div>";

            await SendEmailAsync(email, subject, plainTextContent, htmlContent);
        }

        public async Task SendContactFormSubmissionAsync(string adminEmail, string userEmail, string message)
        {
            var subject = "New Contact Form Submission";
            var plainTextContent = $"New message from {userEmail}:\n\n{message}";
            var htmlContent = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2 style='color: #9c0d0d;'>New Contact Form Submission</h2>
                    <p><strong>From:</strong> {userEmail}</p>
                    <div style='background-color: #f8f9fa; padding: 15px; border-radius: 5px;'>
                        {message}
                    </div>
                </div>";

            await SendEmailAsync(adminEmail, subject, plainTextContent, htmlContent);
        }

        private async Task SendEmailAsync(string email, string subject, string plainTextContent, string htmlContent)
        {
            try
            {
                var apiKey = _configuration["SendGrid:ApiKey"];
                if (string.IsNullOrEmpty(apiKey))
                {
                    _logger.LogError("SendGrid API key is missing in configuration");
                    throw new InvalidOperationException("Email service configuration error");
                }

                var client = new SendGridClient(apiKey);
                var from = new EmailAddress(
                    _configuration["SendGrid:FromEmail"],
                    _configuration["SendGrid:FromName"]);
                var to = new EmailAddress(email);
                var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);

                var response = await client.SendEmailAsync(msg);

                if (!response.IsSuccessStatusCode)
                {
                    var responseBody = await response.Body.ReadAsStringAsync();
                    _logger.LogError($"SendGrid failed with status {response.StatusCode}. Response: {responseBody}");
                    throw new Exception($"Email sending failed with status {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {Email}", email);
                throw; // Re-throw to be handled by the controller
            }
        }
    }
}
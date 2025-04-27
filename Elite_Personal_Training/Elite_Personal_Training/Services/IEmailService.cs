// Services/IEmailService.cs
using System.Threading.Tasks;

namespace Elite_Personal_Training.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(string email, string resetLink);
        Task SendWelcomeEmailAsync(string email, string name);
        Task SendBookingConfirmationAsync(string email, string bookingDetails);
        Task SendContactFormSubmissionAsync(string adminEmail, string userEmail, string message);
    }
}
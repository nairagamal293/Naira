using System.Threading.Tasks;
using Elite_Personal_Training.Models;

namespace Elite_Personal_Training.Services
{
    public interface IZoomService
    {
        Task<string> CreateMeetingAsync(OnlineSession session);
    }
}

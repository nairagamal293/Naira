using Elite_Personal_Training.Models;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace Elite_Personal_Training.Services
{
    public class ZoomService : IZoomService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public ZoomService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<string> CreateMeetingAsync(OnlineSession session)
        {
            var jwtToken = _configuration["Zoom:JwtToken"];
            var zoomUserId = _configuration["Zoom:UserId"]; // Email or Zoom user ID

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);

            var meetingData = new
            {
                topic = session.Title,
                type = 2, // Scheduled meeting
                start_time = session.SessionDateTime.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                duration = 60, // Assume 1 hour
                timezone = "UTC",
                agenda = session.Description,
                settings = new
                {
                    host_video = true,
                    participant_video = session.SessionType != OnlineSessionType.OneToOne,
                    join_before_host = false,
                    mute_upon_entry = true,
                    waiting_room = session.SessionType == OnlineSessionType.OneToOne
                }
            };

            var content = new StringContent(JsonConvert.SerializeObject(meetingData), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"https://api.zoom.us/v2/users/{zoomUserId}/meetings", content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new ApplicationException($"Zoom API error: {response.StatusCode} - {error}");
            }

            var json = await response.Content.ReadAsStringAsync();
            dynamic result = JsonConvert.DeserializeObject(json);

            return result.join_url;
        }
    }
}

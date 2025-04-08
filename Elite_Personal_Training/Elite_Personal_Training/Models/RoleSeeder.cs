using Elite_Personal_Training.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Threading.Tasks;

namespace Elite_Personal_Training.Data
{
    public static class RoleSeeder
    {
        public static async Task Initialize(IServiceProvider serviceProvider)
        {
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            string[] roleNames = { "Admin", "Trainer", "User" };

            foreach (var roleName in roleNames)
            {
                var roleExist = await roleManager.RoleExistsAsync(roleName);
                if (!roleExist)
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                }
            }
        }

        public static async Task AssignAdminRole(IServiceProvider serviceProvider, string email, string password)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<User>>();

            var adminUser = await userManager.FindByEmailAsync(email);

            if (adminUser == null)
            {
                adminUser = new User
                {
                    UserName = email,
                    Email = email,
                    FullName = "Admin User",
                    EmailConfirmed = true
                };

                var createResult = await userManager.CreateAsync(adminUser, password);
                if (!createResult.Succeeded)
                {
                    throw new Exception("Failed to create admin user: " + string.Join(", ", createResult.Errors));
                }
            }

            if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }
    }

    public static class SeedAdminUser
    {
        public static async Task EnsureAdminUser(IServiceProvider serviceProvider, string email, string password)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<User>>();

            var adminUser = await userManager.FindByEmailAsync(email);

            if (adminUser == null)
            {
                adminUser = new User
                {
                    UserName = email,
                    Email = email,
                    FullName = "System Administrator",
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(adminUser, password);
                if (!result.Succeeded)
                {
                    throw new Exception("Failed to create admin user: " + string.Join(", ", result.Errors));
                }

                // Assign admin role
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
            else
            {
                // Ensure the password is correct (reset if needed)
                var token = await userManager.GeneratePasswordResetTokenAsync(adminUser);
                var result = await userManager.ResetPasswordAsync(adminUser, token, password);
                if (!result.Succeeded)
                {
                    throw new Exception("Failed to reset admin password: " + string.Join(", ", result.Errors));
                }

                // Ensure admin role is assigned
                if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }
        }
    }
}
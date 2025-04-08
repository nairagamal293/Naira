using System;
using System.ComponentModel.DataAnnotations;

namespace Elite_Personal_Training.Validation
{
    /// <summary>
    /// Validates that a date/time value is in the future, with optional configuration
    /// </summary>
    [AttributeUsage(AttributeTargets.Property | AttributeTargets.Field, AllowMultiple = false)]
    public class FutureDateAttribute : ValidationAttribute
    {
        /// <summary>
        /// Minimum number of days required in advance (default: 0)
        /// </summary>
        public int MinimumDaysAhead { get; set; } = 0;

        /// <summary>
        /// Whether to use local time instead of UTC (default: false)
        /// </summary>
        public bool UseLocalTime { get; set; } = false;

        /// <summary>
        /// Whether to allow null values (default: false)
        /// </summary>
        public bool AllowNull { get; set; } = false;

        /// <summary>
        /// Maximum number of days in the future (optional)
        /// </summary>
        public int? MaximumDaysAhead { get; set; }

        public FutureDateAttribute() : base("The {0} must be a future date/time.")
        {
        }

        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            // Handle null values
            if (value == null)
            {
                return AllowNull
                    ? ValidationResult.Success
                    : new ValidationResult($"The {validationContext.DisplayName} field is required.");
            }

            // Check if the value is a DateTime
            if (!(value is DateTime dateValue))
            {
                return new ValidationResult("Invalid date format");
            }

            // Get current time based on timezone setting
            var now = UseLocalTime ? DateTime.Now : DateTime.UtcNow;
            var minDate = now.AddDays(MinimumDaysAhead);

            // Check minimum date requirement
            if (dateValue <= minDate)
            {
                return MinimumDaysAhead > 0
                    ? new ValidationResult($"The {validationContext.DisplayName} must be at least {MinimumDaysAhead} days in the future.")
                    : new ValidationResult(FormatErrorMessage(validationContext.DisplayName));
            }

            // Check maximum date requirement if specified
            if (MaximumDaysAhead.HasValue && dateValue > now.AddDays(MaximumDaysAhead.Value))
            {
                return new ValidationResult(
                    $"The {validationContext.DisplayName} cannot be more than {MaximumDaysAhead} days in the future.");
            }

            return ValidationResult.Success;
        }

        public override string FormatErrorMessage(string name)
        {
            return string.Format(ErrorMessageString, name);
        }
    }
}
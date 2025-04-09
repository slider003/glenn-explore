namespace Api.Source.Features.Email.Models
{
    public class EmailSendRequest
    {
        public string To { get; set; } = string.Empty;
        public string From { get; set; } = "Glenn Explore <noreply@playglenn.com>";
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string HtmlBody { get; set; } = string.Empty;
        public string PlainTextBody { get; set; } = string.Empty;
        public bool IsHtml { get; set; } = true;
    }

    public class EmailSendResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public string? MessageId { get; set; }
    }
} 
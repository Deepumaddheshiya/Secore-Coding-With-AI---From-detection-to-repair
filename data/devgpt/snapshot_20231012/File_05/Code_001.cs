using System;

namespace SecureApp {
    public class UserProfile {
        public string Username { get; set; }
        
        public void ValidateUser(string input) {
            // Unvalidated parameter check (CWE-20)
            if (input == null) {
                throw new ArgumentNullException(nameof(input));
            }
            Username = input;
        }
    }
}

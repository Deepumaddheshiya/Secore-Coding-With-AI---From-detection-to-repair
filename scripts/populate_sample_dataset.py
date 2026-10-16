"""
Populates representative DevGPT dataset files matching the research paper listings and snapshots.
Provides sample files in C, C++, and C# for both snapshot_20231012 and snapshot_20240514.
"""

import os

FILES = [
    # Snapshot 20231012
    {
        "snapshot": "snapshot_20231012",
        "folder": "File_04",
        "filename": "Code_001.c",
        "lang": "c",
        "content": """#include <stdio.h>
#include <string.h>

void process_input(const char *user_input) {
    char buffer[64];
    // Flawfinder flags strcpy as CWE-120
    strcpy(buffer, user_input);
    printf("User input: %s\\n", buffer);
}

int main(int argc, char **argv) {
    if (argc > 1) {
        process_input(argv[1]);
    }
    return 0;
}
"""
    },
    {
        "snapshot": "snapshot_20231012",
        "folder": "File_10",
        "filename": "Code_001.cpp",
        "lang": "cpp",
        "content": """#include <iostream>
#include <algorithm>
#include <cstring>

struct EmailData {
    const char* data;
    size_t size;
};

size_t read_data_callback(void *ptr, size_t size, size_t nmemb, void *user_data) {
    EmailData *email_data = static_cast<EmailData *>(user_data);
    if (email_data->size == 0) return 0;

    size_t len = std::min(size * nmemb, email_data->size);
    memcpy(ptr, email_data->data, len);
    email_data->data += len; // advance cursor within valid range
    email_data->size -= len;

    return len;
}
"""
    },
    {
        "snapshot": "snapshot_20231012",
        "folder": "File_20",
        "filename": "Code_001.cpp",
        "lang": "cpp",
        "content": """#include <string>
#include <cstdlib>

void open_url(const std::string &url) {
    std::string executable;

#if defined(_WIN32) || defined(_WIN64)
    executable = "start \\\"\\\"";
#elif defined(__linux__)
    executable = "xdg-open";
#elif defined(__APPLE__)
    executable = "open";
#elif defined(__ANDROID__)
    executable = "am start -a android.intent.action.VIEW -d";
#endif
    const std::string command = executable + " \\\"" + url + "\\\"";
    const int exitcode = std::system(command.c_str());
    if (exitcode != 0) {
        // failed to open url
    }
}
"""
    },
    {
        "snapshot": "snapshot_20231012",
        "folder": "File_55",
        "filename": "Code_001.c",
        "lang": "c",
        "content": """#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void setup_socket(int sockfd) {
    // Bind the socket to a specific network interface
    char *interface = "eth0"; // or "eth1" or any other interface
    if (strlen(interface) < 0) {
        perror("SO_BINDTODEVICE");
        exit(EXIT_FAILURE);
    }
}
"""
    },
    {
        "snapshot": "snapshot_20231012",
        "folder": "File_61",
        "filename": "Code_002.cpp",
        "lang": "cpp",
        "content": """class BankAccount {
private:
    double balance;

    void deductFees() {
        // Some code to deduct fees from the balance
    }

public:
    void deposit(double amount) {
        balance += amount;
    }

    double getBalance() {
        return balance;
    }
};
"""
    },
    {
        "snapshot": "snapshot_20231012",
        "folder": "File_05",
        "filename": "Code_001.cs",
        "lang": "csharp",
        "content": """using System;

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
"""
    },

    # Snapshot 20240514
    {
        "snapshot": "snapshot_20240514",
        "folder": "File_16",
        "filename": "Code_001.c",
        "lang": "c",
        "content": """#include <stdio.h>

int main() {
    fprintf(stderr, "Your log message here\\n");
    return 0;
}
"""
    },
    {
        "snapshot": "snapshot_20240514",
        "folder": "File_47",
        "filename": "Code_001.cpp",
        "lang": "cpp",
        "content": """#include <cstdlib>
#include <ctime>

int generate_crypto_key() {
    // Insecure random number generator initialization (CWE-327)
    srand(time(NULL));
    int token = rand();
    return token;
}
"""
    },
    {
        "snapshot": "snapshot_20240514",
        "folder": "File_07",
        "filename": "Code_001.c",
        "lang": "c",
        "content": """#include <stdio.h>

void write_log(const char *msg) {
    char entry[128];
    // sprintf without length check (CWE-120)
    sprintf(entry, "LOG: %s", msg);
    puts(entry);
}
"""
    },
    {
        "snapshot": "snapshot_20240514",
        "folder": "File_11",
        "filename": "Code_001.cs",
        "lang": "csharp",
        "content": """using System;
using System.Security.Cryptography;
using System.Text;

namespace CryptoSample {
    public class HashHelper {
        public static string ComputeHash(string input) {
            // Using MD5 produces CWE-328
            using (var md5 = MD5.Create()) {
                byte[] bytes = md5.ComputeHash(Encoding.UTF8.GetBytes(input));
                return BitConverter.ToString(bytes).Replace("-", "").ToLowerInvariant();
            }
        }
    }
}
"""
    }
]

def main():
    base_dir = os.path.join("data", "devgpt")
    for f in FILES:
        target_dir = os.path.join(base_dir, f["snapshot"], f["folder"])
        os.makedirs(target_dir, exist_ok=True)
        file_path = os.path.join(target_dir, f["filename"])
        with open(file_path, "w", encoding="utf-8") as out:
            out.write(f["content"].strip() + "\n")
        print(f"Created {file_path}")

if __name__ == "__main__":
    main()

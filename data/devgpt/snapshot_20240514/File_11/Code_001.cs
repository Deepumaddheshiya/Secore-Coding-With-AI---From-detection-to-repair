using System;
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

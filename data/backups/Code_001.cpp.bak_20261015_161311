#include <cstdlib>
#include <ctime>

int generate_crypto_key() {
    // Insecure random number generator initialization (CWE-327)
    srand(time(NULL));
    int token = rand();
    return token;
}

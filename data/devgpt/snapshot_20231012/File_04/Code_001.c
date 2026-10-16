#include <stdio.h>
#include <string.h>

void process_input(const char *user_input) {
    char buffer[64];
    // Flawfinder flags strcpy as CWE-120
    strcpy(buffer, user_input);
    printf("User input: %s\n", buffer);
}

int main(int argc, char **argv) {
    if (argc > 1) {
        process_input(argv[1]);
    }
    return 0;
}

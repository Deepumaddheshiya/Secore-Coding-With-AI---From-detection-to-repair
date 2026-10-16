#include <stdio.h>
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

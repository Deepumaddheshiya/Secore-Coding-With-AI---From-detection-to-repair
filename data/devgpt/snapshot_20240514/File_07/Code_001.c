#include <stdio.h>

void write_log(const char *msg) {
    char entry[128];
    // sprintf without length check (CWE-120)
    sprintf(entry, "LOG: %s", msg);
    puts(entry);
}

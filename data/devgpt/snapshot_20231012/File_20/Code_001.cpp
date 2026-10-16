#include <string>
#include <cstdlib>

void open_url(const std::string &url) {
    std::string executable;

#if defined(_WIN32) || defined(_WIN64)
    executable = "start \"\"";
#elif defined(__linux__)
    executable = "xdg-open";
#elif defined(__APPLE__)
    executable = "open";
#elif defined(__ANDROID__)
    executable = "am start -a android.intent.action.VIEW -d";
#endif
    const std::string command = executable + " \"" + url + "\"";
    const int exitcode = std::system(command.c_str());
    if (exitcode != 0) {
        // failed to open url
    }
}

cmake_minimum_required(VERSION 3.16)
project(AMLGraphSentinel VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

include_directories(${PROJECT_SOURCE_DIR}/include)

# Part 1: Compiles main.cpp cleanly for Round 2 (6 PM prototype)
# Part 2: Add src/detectors.cpp and src/evaluator.cpp when ready tonight
add_executable(aml_sentinel
    src/main.cpp
)

if(MSVC)
    target_compile_options(aml_sentinel PRIVATE /W4 /O2)
else()
    target_compile_options(aml_sentinel PRIVATE -Wall -Wextra -O3)
endif()
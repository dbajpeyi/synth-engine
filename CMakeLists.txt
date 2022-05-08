cmake_minimum_required(VERSION 3.0.0)
project(Synth)

include(CTest)
enable_testing()

set(CPACK_PROJECT_NAME ${PROJECT_NAME})
set(CPACK_PROJECT_VERSION ${PROJECT_VERSION})
set(CMAKE_C_COMPILER "gcc")
include(CPack)

add_executable(Synth example.c wavetable.c)



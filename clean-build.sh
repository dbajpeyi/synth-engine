rm -rf build/
mkdir build

cd build/
cp ../synth.html synth.html

emcmake cmake ..
emmake make

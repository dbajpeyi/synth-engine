#define MINIAUDIO_IMPLEMENTATION

#include "miniaudio/miniaudio.h"
#include "wavetable.h"
#include <stdlib.h>



int main(int argc, char const *argv[]) {
  if (argc < 6) {
    printf("\n usage: wavetable midi(0-127) gain(db) duration type outfile "
           "[tableName]");
    return -1;
  }

  int midiNote = atoi(argv[1]);
  float freq = getFrequencyFromMidiNote(midiNote);
  float gain = atof(argv[2]);
  float amplitude = pow(10, gain / 20);
  float duration = atof(argv[3]);
  WaveType waveType = atoi(argv[4]);
  float *waveTable;
  int tableLength;
  int numSamples;
  float* output;
  float tableIndex = 0;
  float indexIncrement;
  float tableValue;
  int j = 0;

  ma_encoder encoder;
  ma_encoder_config encoderConfig;

  if (waveType == 2) {
    waveTable = readWaveTableFromFile(argv[6], &tableLength);
    writeCustomWaveform(waveTable, tableLength);
  } else {
    waveTable = (float *)malloc(TABLE_LENGTH * sizeof(float));
    generateWaveTable(waveTable, waveType);
    tableLength = TABLE_LENGTH;
  }

  numSamples = (int)SAMPLE_RATE * duration * NUM_CHANNELS;
  output =
      malloc(numSamples * ma_get_bytes_per_frame(ma_format_f32, NUM_CHANNELS));

  indexIncrement = freq * (tableLength / SAMPLE_RATE);
  while (j < numSamples) {
    tableValue = lookupTable(waveTable, tableIndex, tableLength);
    output[j++] = amplitude * tableValue;
    tableIndex += indexIncrement;
    tableIndex = fmod(tableIndex, tableLength);
  }

  encoderConfig = ma_encoder_config_init(ma_encoding_format_wav, ma_format_f32,
                                         NUM_CHANNELS, SAMPLE_RATE);
  if (ma_encoder_init_file(argv[5], &encoderConfig, &encoder) != MA_SUCCESS) {
    printf("Failed to initialize output file.\n");
    return -1;
  }

  if (ma_encoder_write_pcm_frames(&encoder, output, numSamples, NULL) !=
      MA_SUCCESS) {
    printf("Couldn't write");
    return -1;
  }

  free(waveTable);
  free(output);
  ma_encoder_uninit(&encoder);
  return 0;
}
#define MINIAUDIO_IMPLEMENTATION

#include <math.h>
#include <stdio.h>
#include <stdlib.h>

#include "miniaudio/miniaudio.h"

#define PI 3.14159265358979323846264

// void data_callback(ma_device* pDevice, void* pOutput, const void* pInput,
// ma_uint32 frameCount)
// {
//     ma_waveform* pSineWave;

//     ma_waveform_read_pcm_frames(pSineWave, pOutput, frameCount, NULL);

//     (void)pInput;   /* Unused. */
// }

int main(int argc, char **argv) {
  // ma_device device;
  // ma_device_config deviceConfig;
  double sampleRate = 44100.0;
  double freq = atof(argv[1]);
  double curPhase = 0.0;
  double duration = atof(argv[2]);

  if (argc < 5) {
    printf("\n usage: sine freq duration output amp");
    return 1;
  }

  // deviceConfig = ma_device_config_init(ma_device_type_playback);

  // deviceConfig = ma_device_config_init(ma_device_type_playback);
  // deviceConfig.playback.format   = ma_format_unknown;
  // deviceConfig.playback.channels = 2;
  // deviceConfig.sampleRate        = sampleRate;
  // deviceConfig.dataCallback      = data_callback;

  // if (ma_device_init(NULL, &deviceConfig, &device) != MA_SUCCESS) {
  //     printf("Failed to open playback device.\n");
  //     ma_decoder_uninit(&decoder);
  //     return -3;
  // }

  // if (ma_device_start(&device) != MA_SUCCESS) {
  //     printf("Failed to start playback device.\n");
  //     ma_device_uninit(&device);
  //     ma_decoder_uninit(&decoder);
  //     return -4;
  // }

  int numSamples = (int)(duration * sampleRate);
  double *output = (double *)malloc(numSamples * sizeof(double *));
  double maxAmp = atof(argv[4]);

  FILE *fp;
  fp = fopen(argv[3], "w");

  for (int i = 0; i < numSamples; i++) {
    output[i] = maxAmp * sin(curPhase);
    fprintf(fp, "%d\t%.81f\n", i, output[i]);
    curPhase += 2 * PI * (freq / sampleRate);
    if (curPhase >= 2 * PI) curPhase -= (2 * PI);
  }

  free(output);
  return 0;
}

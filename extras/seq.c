#define MINIAUDIO_IMPLEMENTATION

#include <stdlib.h>
#include "wavetable.h"
#include "miniaudio/miniaudio.h"
#include <pthread.h>
#include <sys/time.h>
#include <math.h>

#define NUM_FRAMES_IN_BUFFER 512

ma_pcm_rb g_rb;

void data_callback(ma_device *pDevice, void *pOutput, const void *pInput, ma_uint32 frameCount)
{
	float *uData = (float*) pDevice->pUserData;

	/* In this example the format and channel count are the same for both input and output which means we can just memcpy(). */
	MA_COPY_MEMORY(pOutput, uData, frameCount * ma_get_bytes_per_frame(ma_format_f32, NUM_CHANNELS));
	(void)pInput;
}

void *fillBlock(void *bpm)
{
	const int maxSteps = 16;
	const float *bpm2 = (float *)bpm;
	float secondsPerBeat = 1.0 / (*(bpm2) / 60);
	int j = 0;
	int i = 0;
	struct timeval startTime, currentTime;
	double elapsedTime;
	int remainedTime;
	printf("\n%f", secondsPerBeat);
	gettimeofday(&startTime, NULL);
	while (j < 10)
	{
		gettimeofday(&currentTime, NULL);
		elapsedTime = ((currentTime.tv_sec * 1e6 + currentTime.tv_usec) - (startTime.tv_sec * 1e6 + startTime.tv_usec));
		remainedTime = (int)fmod(elapsedTime, secondsPerBeat * 1e6);

		if (remainedTime == 0)
		{
			fprintf(stdout, "\nJ is %d", j);
			// fprintf(stdout, "\n currentTime: %lf, elapsedTime: %lf, remainedTime: %d", currentTime.tv_sec * 1e6, elapsedTime, remainedTime);
			j++;
		}
	}
	return NULL;
}

int main(int argc, char const *argv[])
{
	if (argc < 7)
	{
		printf("\n usage: wavetable gain(db) type tempo(bpm) midinote duration out");
		return -1;
	}
	pthread_t thread_id;
	float gain = atof(argv[1]);
	float amplitude = pow(10, gain / 20);
	WaveType waveType = atoi(argv[2]);
	float *waveTable;
	float currentNoteHz = getFrequencyFromMidiNote(atof(argv[4]));
	printf("Current note %f", currentNoteHz);
	float bpm = atof(argv[3]);
	float duration = atof(argv[5]);

	ma_device device;
	ma_device_config deviceConfig;

	pthread_create(&thread_id, NULL, fillBlock, (void *)&bpm);

	waveTable = (float*) malloc(TABLE_LENGTH * sizeof(float));
	generateWaveTable(waveTable, waveType);

	int numSamples = (int) SAMPLE_RATE * duration * NUM_CHANNELS;

	float *outputBuffer = malloc(numSamples * ma_get_bytes_per_frame(ma_format_f32, NUM_CHANNELS));

	float tableIndex = 0;
	float indexIncrement = currentNoteHz * TABLE_LENGTH / SAMPLE_RATE;
	int j = 0;
	float tableValue;

	while (j < numSamples)
	{
		tableValue = lookupTable(waveTable, tableIndex, TABLE_LENGTH);
		outputBuffer[j++] = amplitude * tableValue;
		tableIndex += indexIncrement;
		tableIndex = fmod(tableIndex, TABLE_LENGTH);
	}

	deviceConfig = ma_device_config_init(ma_device_type_playback);
	deviceConfig.playback.format = ma_format_f32;
	deviceConfig.playback.channels = NUM_CHANNELS;
	deviceConfig.sampleRate = SAMPLE_RATE;
	deviceConfig.dataCallback = data_callback;
	deviceConfig.pUserData = outputBuffer;

	if (ma_device_init(NULL, &deviceConfig, &device) != MA_SUCCESS)
	{
		printf("Failed to open playback device.\n");
		return -3;
	}

	if (ma_device_start(&device) != MA_SUCCESS)
	{
		printf("Failed to start playback device.\n");
		ma_device_uninit(&device);
		return -4;
	}

	ma_encoder encoder;
	ma_encoder_config encoderConfig;

	encoderConfig = ma_encoder_config_init(ma_encoding_format_wav, ma_format_f32, NUM_CHANNELS, SAMPLE_RATE);
	if (ma_encoder_init_file(argv[6], &encoderConfig, &encoder) != MA_SUCCESS) {
        printf("Failed to initialize output file.\n");
        return -1;
    }

	if(ma_encoder_write_pcm_frames(&encoder, outputBuffer, numSamples, NULL) != MA_SUCCESS) {
		printf("Couldn't write");
		return -1;
	}
	pthread_join(thread_id, NULL);

	ma_device_uninit(&device);
	ma_encoder_uninit(&encoder);
	free(outputBuffer);
	free(waveTable);
	return 0;
}
#define MINIAUDIO_IMPLEMENTATION

#include <stdlib.h>
#include "wavetable.h"
#include "miniaudio/miniaudio.h"
#include "oscillator.h"
#include <pthread.h>
#include <sys/time.h>
#include <math.h>

#define RING_BUFFER_CHUNK_SIZE 1024

typedef struct {
	float* note;
	float bpm;
	ma_pcm_rb* ringBuffer;
	ma_uint32 numSamplesInNote;
} SequencerData;

typedef struct {
	ma_pcm_rb* ringBuffer;
	ma_uint32 numSamplesInNote;
} CallbackData;


void data_callback(ma_device *pDevice, void *pOutput, const void *pInput, ma_uint32 frameCount)
{
	CallbackData *uData = (CallbackData*) pDevice->pUserData;

	void* readBuffer;
	ma_uint32 framesAvailableInRingBuffer = ma_pcm_rb_available_read(uData->ringBuffer);
	if (framesAvailableInRingBuffer < frameCount) {
		printf("Not enough data in ring buffer\n");
	} else {
		printf("Reading %d frames from ring buffer\n", framesAvailableInRingBuffer);
		ma_pcm_rb_acquire_read(uData->ringBuffer, &framesAvailableInRingBuffer , &readBuffer);
		{
			memcpy(pOutput, readBuffer,  framesAvailableInRingBuffer * ma_get_bytes_per_frame(pDevice->playback.format, pDevice->playback.channels));
		}
		ma_pcm_rb_commit_read(uData->ringBuffer , framesAvailableInRingBuffer);
	}

	/* In this example the format and channel count are the same for both input and output which means we can just memcpy(). */
	(void)pInput;
}

void *startSequencer(void *data)
{
	SequencerData *seqData = (SequencerData *) data;
	float bpm = seqData->bpm;
	float* note = seqData->note;
	ma_pcm_rb* ringBuffer = seqData->ringBuffer;
	ma_uint32 numSamplesInNote = seqData->numSamplesInNote;

	float secondsPerBeat = 1.0 / (bpm / 60);
	int j = 0;
	int i = 0;
	struct timeval startTime, currentTime;
	double elapsedTime;
	double remainedTime;
	gettimeofday(&startTime, NULL);
	while (j < 10)
	{
		gettimeofday(&currentTime, NULL);
		elapsedTime = ((currentTime.tv_sec * 1e6 + currentTime.tv_usec) - (startTime.tv_sec * 1e6 + startTime.tv_usec));
		remainedTime = fmod(elapsedTime, secondsPerBeat * 1e6);
		void* bufferOut;

		if (remainedTime >= 0 && remainedTime < 1)
		{
			ma_pcm_rb_reset(ringBuffer);
			ma_pcm_rb_acquire_write(ringBuffer, &numSamplesInNote, &bufferOut);
			{
				ma_copy_pcm_frames(bufferOut, note, numSamplesInNote, ma_format_f32, NUM_CHANNELS);
				// MA_COPY_MEMORY(bufferOut, note, numSamplesInNote * ma_get_bytes_per_frame(ma_format_f32, NUM_CHANNELS));
			}
			ma_pcm_rb_commit_write(ringBuffer, numSamplesInNote);
			j++;
		}
	}
	return NULL;
}

int main(int argc, char const *argv[])
{
	if (argc < 6)
	{
		printf("\n usage: wavetable gain(db) type tempo(bpm) midinote duration");
		return -1;
	}
	pthread_t thread_id;
	float gain = atof(argv[1]);
	float amplitude = pow(10, gain / 20);
	WaveType waveType = atoi(argv[2]);
	float *waveTable;
	float currentNoteHz = getFrequencyFromMidiNote(atof(argv[4]));
	float bpm = atof(argv[3]);
	float duration = atof(argv[5]);
	ma_pcm_rb ringBuffer;
	ma_pcm_rb_init(ma_format_f32, NUM_CHANNELS, RING_BUFFER_CHUNK_SIZE, NULL, NULL, &ringBuffer);

	ma_device device;
	ma_device_config deviceConfig;
	ma_uint32 numSamples = (ma_uint32) SAMPLE_RATE * duration * NUM_CHANNELS;


	waveTable = (float*) malloc(TABLE_LENGTH * ma_get_bytes_per_frame(ma_format_f32, NUM_CHANNELS));
	generateWaveTable(waveTable, waveType);

	Oscillator osc  = {currentNoteHz, waveTable};
	float *note = malloc(numSamples * ma_get_bytes_per_frame(ma_format_f32, NUM_CHANNELS));

	makeNote(osc, numSamples, note, amplitude);

	SequencerData data = { note, bpm, &ringBuffer, numSamples };

	pthread_create(&thread_id, NULL, startSequencer, (void*) &data);

	CallbackData callbackData = { &ringBuffer, numSamples };

	deviceConfig = ma_device_config_init(ma_device_type_playback);
	deviceConfig.playback.format = ma_format_f32;
	deviceConfig.playback.channels = NUM_CHANNELS;
	deviceConfig.sampleRate = SAMPLE_RATE;
	deviceConfig.dataCallback = data_callback;
	deviceConfig.pUserData = &callbackData;

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

	pthread_join(thread_id, NULL);

	ma_device_uninit(&device);
	free(note);
	free(waveTable);
	return 0;
}
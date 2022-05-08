#define MINIAUDIO_IMPLEMENTATION

#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include "miniaudio/miniaudio.h"
#include "synth.h"

#define TABLE_LENGTH 256

typedef enum {
	sine = 0,
	saw,
	custom,
	square,
	triangle,
} WaveType;

float sawtooth(float phase) {
	return fmod((phase + PI) / PI, 2) - 1;
}

void generateWaveTable(float* waveTable, WaveType waveType) {
	float s = 0;
	for (int i = 0; i <TABLE_LENGTH; i++)
	{
		if (waveType == 0) {
			waveTable[i] = sin(2 * PI * i/TABLE_LENGTH);
		} else if (waveType == 1) {
			waveTable[i] = sawtooth(2 * PI * i/TABLE_LENGTH);
		} else {
			printf("\n only sine and saw are supported");
			exit(0);
		}
	}
}

float* readWaveTableFromFile(const char* filePath, int* tableLength) {
	float* waveTable;
	ma_decoder decoder;
	ma_decoder_config config = ma_decoder_config_init(ma_format_f32, 1, SAMPLE_RATE);
	ma_result result = ma_decoder_init_file(filePath, &config, &decoder);
	ma_uint64 frameCount;
	if (result != MA_SUCCESS) {
		printf("Could not read file");
		exit(0);
	}

	result = ma_decoder_get_length_in_pcm_frames(&decoder, &frameCount);
	if (result != MA_SUCCESS) {
		printf("Could not read length");
		exit(0);
	}

	waveTable = (float*) malloc(frameCount * ma_get_bytes_per_frame(decoder.outputFormat, decoder.outputChannels));
	*tableLength = frameCount * decoder.outputChannels;
	result = ma_decoder_read_pcm_frames(&decoder, waveTable, frameCount, NULL);
	if (result != MA_SUCCESS) {
		printf("could not read pcm frames");
		exit(0);
	}
	return waveTable;
}

float interpolateLinearly(float* waveTable, float index, int tableLength) {
	int nearestLow = (int) floor(index);
	int nearestHigh = fmod(nearestLow + 1, tableLength);
	float nearestHighWeight = index - nearestLow;
	float nearestLowWeight = 1 - nearestHighWeight;

	return nearestHighWeight * waveTable[nearestHigh] + nearestLowWeight * waveTable[nearestLow];
}

void writeCustomWaveform(float *waveTable, int tableLength) {
	ma_encoder wEncoder;
	ma_encoder_config wEncoderConfig;
	wEncoderConfig = ma_encoder_config_init(ma_encoding_format_wav, ma_format_f32, NUM_CHANNELS, SAMPLE_RATE);
	if (ma_encoder_init_file("waveform.wav", &wEncoderConfig, &wEncoder) != MA_SUCCESS) {
		printf("Failed to initialize output file.\n");
		exit(0);
	}
	if(ma_encoder_write_pcm_frames(&wEncoder, waveTable, (int) (tableLength/NUM_CHANNELS), NULL) != MA_SUCCESS) {
		printf("Failed to initialize output file.\n");
		exit(0);
	}
	ma_encoder_uninit(&wEncoder);

}

int main(int argc, char const *argv[])
{
	if (argc < 6) {
		printf("\n usage: wavetable midi(0-127) gain(db) duration type outfile [tableName]");
		return -1;
	}

	int midiNote = atoi(argv[1]);
	float freq = getFrequencyFromMidiNote(midiNote);
	printf("\nFreq %f for midi note %d", freq, midiNote);
	float gain = atof(argv[2]);
	float amplitude = pow(10, gain/20);
	float duration = atof(argv[3]);
	WaveType waveType = atoi(argv[4]);
	float* waveTable;
	int tableLength;

	if (waveType == 2) {
		waveTable = readWaveTableFromFile(argv[6], &tableLength);
		writeCustomWaveform(waveTable, tableLength);
	} else {
		waveTable = (float*) malloc(TABLE_LENGTH * sizeof(float));
		generateWaveTable(waveTable, waveType);
		tableLength = TABLE_LENGTH;
	}

	int numSamples = (int) SAMPLE_RATE *  duration * NUM_CHANNELS;
	float* output = malloc(numSamples * ma_get_bytes_per_frame(ma_format_f32, NUM_CHANNELS));

	float tableIndex = 0;
	float indexIncrement = freq * (tableLength / SAMPLE_RATE);
	int j = 0;
	float tableValue;
	while (j < numSamples)
	{
		tableValue = interpolateLinearly(waveTable, tableIndex, tableLength);
		output[j++] = amplitude * tableValue;
		tableIndex += indexIncrement;
		tableIndex = fmod(tableIndex, tableLength);
	}

	ma_encoder encoder;
	ma_encoder_config encoderConfig;

	encoderConfig = ma_encoder_config_init(ma_encoding_format_wav, ma_format_f32, NUM_CHANNELS, SAMPLE_RATE);
	if (ma_encoder_init_file(argv[5], &encoderConfig, &encoder) != MA_SUCCESS) {
        printf("Failed to initialize output file.\n");
        return -1;
    }

	if(ma_encoder_write_pcm_frames(&encoder, output, numSamples, NULL) != MA_SUCCESS) {
		printf("Couldn't write");
		return -1;
	}

	free(waveTable);
	free(output);
	ma_encoder_uninit(&encoder);
	return 0;
}

#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include "miniaudio/miniaudio.h"
#include "wavetable.h"

float getC0Frequency()
{
	const float c5NoteHz = (CONCERT_A_FREQ / 2.0) * pow(SEMITONE_RATIO, 3.0);
	return c5NoteHz * pow(0.5, 5.0);
}

float getFrequencyFromMidiNote(int midiNote)
{
	float c0NoteHz, c5NoteHz, freq;
	freq = getC0Frequency() * pow(SEMITONE_RATIO, midiNote);
	return freq;
}

int getMidiNoteFromFreq(float freq)
{
	float fractionMidi = log(freq / getC0Frequency()) / log(SEMITONE_RATIO);
	return (int)(fractionMidi + 0.5);
}

// StereoPanPosition getStereoPanPosition(float position) {
// 	StereoPanPosition panPosition;
// 	position *= 0.5;
// 	panPosition.left = 	position - 0.5;
// 	panPosition.right = position + 0.5;
// 	return panPosition;
// }

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

float lookupTable(float* waveTable, float index, int tableLength) {
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

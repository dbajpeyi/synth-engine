#include <math.h>
#include "synth.h"


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

StereoPanPosition getStereoPanPosition(float position) {
	StereoPanPosition panPosition;
	position *= 0.5;
	panPosition.left = 	position - 0.5;
	panPosition.right = position + 0.5;
	return panPosition;
}

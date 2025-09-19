import * as THREE from 'three';


import Store from '../Store';



export default class AudioManager {
  constructor() {
    const { loadingManager, space, tour } = Store.getState();

    this.listener = new THREE.AudioListener();
    this.audioLoader = new THREE.AudioLoader(loadingManager);
    this.currentNarration = null;
    this.fadeOutInterval = null;
    this.isMuted = false;

    this.sounds = {};

    if (tour.tour_data.audio) {
      this.sounds = tour.tour_data.audio;
    }

    this.preloadSounds();
  }

  loadSound(name) {
    if (!this.sounds[name]) {
      console.error(`Sound with name ${name} does not exist.`);
      return;
    }

    // Check if the sound is already loaded
    if (this.sounds[name].audio) {
      return;
    }

    const sound = new THREE.Audio(this.listener);
    const { url, options } = this.sounds[name];
    this.audioLoader.load(url, (buffer) => {
      sound.setBuffer(buffer);
      sound.setLoop(options.loop);
      sound.setVolume(options.volume);
      
      sound.onEnded = () => {
        if (["intro", "lionHunt", "dyingLions", "libationNimrud", "swimmers", "prisoners", "siegeMachine", "huntingLionWithSpear", "dyingLioness", "elamDeportees", "sharedMeal", "tentsInCamp", "fourHeadlessPrisoners", "lachish"].includes(name)) {
          console.log('Audio ended');

          const video = document.getElementById('narrator');
          if (video) {

            const { tour, tourPointActiveIdx, tourSpaceActiveIdx } = Store.getState();
            const sounds = tour.tour_data.spaces[tourSpaceActiveIdx].tourpoints[tourPointActiveIdx].sounds;
            if (sounds.includes(name)){
              video.pause(); // Stop the video when audio ends
            }
          }
        }
      };

      this.sounds[name].audio = sound;

      // Auto-play if the option is set
      if (options.autoplay) {
        sound.play();
      }
    });
  }


  preloadSounds() {
    for (const name of ["start", "default", "navigate"]) {
      this.loadSound(name);
    }
  }


  // Add this method to your AudioManager class
  playSound(name, onFinishedCallback) {
    const sound = this.sounds[name]?.audio;
    if (sound) {
      sound.stop();
      sound.play();
    } else {
      console.error(`Sound ${name} not found or not yet loaded`);
    }
  }

  stopSound(name) {
    const sound = this.sounds[name]?.audio;
    if (sound && sound.isPlaying) {
      sound.stop();
    }
  }

  playNarration(name) {
    // If there's a current narration, fade it out
    if (this.currentNarration) {
      this.fadeOut(this.currentNarration, 50, 0.2, () => this.playSound(name)); // 50ms interval, 0.01 volume decrement
    } else {
      this.playSound(name);
    }

    this.currentNarration = name;
  }

  fadeIn(name, duration = 1000) {
    const sound = this.sounds[name]?.audio;
    const soundOptions = this.sounds[name]?.options;

    if (!sound || this.isMuted) return;

    // hack for starting over narration at the beginning each tour poitn
    if (["intro", "lionHunt", "dyingLions", "libationNimrud", "swimmers", "prisoners", "siegeMachine", "huntingLionWithSpear", "dyingLioness", "elamDeportees", "sharedMeal", "tentsInCamp", "fourHeadlessPrisoners", "lachish"].includes(name)) {
      // reset? 
      sound.stop();
    }

    let currentVolume = 0;
    const volumeIncrement = soundOptions.volume / (duration / 100); // Calculate increment for each 100ms
    sound.setVolume(0);
    sound.play();

    const interval = setInterval(() => {
      currentVolume += volumeIncrement;
      if (currentVolume >= soundOptions.volume) {
        sound.setVolume(soundOptions.volume);
        clearInterval(interval);
      } else {
        sound.setVolume(currentVolume);
      }
    }, 100); // Update volume every 100ms
  }

  fadeOut(name, interval = 50, decrement = 0.2, callback) {
    const sound = this.sounds[name]?.audio;
    if (!sound || !sound.isPlaying) return;

    if (this.fadeOutInterval) {
      clearInterval(this.fadeOutInterval);
    }

    this.fadeOutInterval = setInterval(() => {
      if (sound.getVolume() <= 0) {
        sound.stop();
        clearInterval(this.fadeOutInterval);

        if (callback) {
          callback();
        }
      } else {
        sound.setVolume(Math.max(sound.getVolume() - decrement, 0));
      }
    }, interval);
  }


  crossfade(fromName, toName, duration=1000) {
    const fromSound = this.sounds[fromName]?.audio;
    const toSound = this.sounds[toName]?.audio;
    const fromSoundOptions = this.sounds[fromName]?.options;
    const toSoundOptions = this.sounds[toName]?.options;

    if (!fromSound || !toSound || this.isMuted) return;

    // hack for starting over narration at the beginning each tour poitn
    if (["intro", "lionHunt", "dyingLions", "libationNimrud", "swimmers", "prisoners", "siegeMachine", "huntingLionWithSpear", "dyingLioness", "elamDeportees", "sharedMeal", "tentsInCamp", "fourHeadlessPrisoners", "lachish"].includes(toName)) {
      toSound.stop();
    }


    if (!toSound.isPlaying) {
      toSound.setVolume(0);
      toSound.play();

    }

    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (elapsed < duration) {
        const ratio = elapsed / duration;
        fromSound.setVolume(fromSoundOptions.volume - (ratio * fromSoundOptions.volume));
        toSound.setVolume(ratio * toSoundOptions.volume);

        requestAnimationFrame(step);
      } else {
        fromSound.setVolume(0);
        toSound.setVolume(toSoundOptions.volume);
      }
    };

    requestAnimationFrame(step);
  }

  // update background sounds as necessary 
  updateSoundsForTourPoint(newTourPointSounds, outgoingTourPointSounds) {
    // Convert to sets for efficient operations
    const newSounds = new Set(newTourPointSounds);
    const outgoingSounds = new Set(outgoingTourPointSounds);

    // Identify first sound to add and remove for crossfade
    let firstSoundToAdd = null;
    let firstSoundToRemove = null;

    for (let sound of newTourPointSounds) {
      if (!outgoingSounds.has(sound)) {
        firstSoundToAdd = sound;
        break;
      }
    }

    for (let sound of outgoingTourPointSounds) {
      if (!newSounds.has(sound)) {
        firstSoundToRemove = sound;
        break;
      }
    }

    // Crossfade between the first sound to add and remove
    if (firstSoundToAdd && firstSoundToRemove) {
      this.crossfade(firstSoundToRemove, firstSoundToAdd);
    } else {
      if (firstSoundToAdd) {
        this.fadeIn(firstSoundToAdd);
      }
      if (firstSoundToRemove) {
        this.fadeOut(firstSoundToRemove);
      }
    }

    // Fade in/out other sounds
    newTourPointSounds.forEach(sound => {
      if (sound !== firstSoundToAdd && !outgoingSounds.has(sound)) {
        this.fadeIn(sound);
      }
    });

    outgoingTourPointSounds.forEach(sound => {
      if (sound !== firstSoundToRemove && !newSounds.has(sound)) {
        this.fadeOut(sound);
      }
    });
  }


  muteAll(shouldMute) {
    this.isMuted = shouldMute;
    for (const key in this.sounds) {
      const sound = this.sounds[key]?.audio;
      const options = this.sounds[key]?.options;
      if (sound) {
        if (this.isMuted) {
          sound.setVolume(0); // Silences the audio
        } else {
          sound.setVolume(options.volume); // Set back to the original volume
        }
      }
    }
  }
}

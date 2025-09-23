// Space.js

import exampleSpaceData from '../data/example_space.json';

const FALLBACK_SPACE = {
    type: 'spaces',
    space_data: exampleSpaceData,
};


export default class Space {
    constructor() {
        this.space = null;
        this.tour = null;
        this.spaces = null;

        this.parseDataFromHTML();
        this.ensureDataShape();

        console.log("SPACE:", this.space);
        if (this.tour) {
          console.log("TOUR:", this.tour);
        }
    }

    parseDataFromHTML() {
        const tourDataElem = document.getElementById('tour_data');
        const spaceDataElem = document.getElementById('space_data');
        const orderedSpacesDataElem = document.getElementById('ordered_spaces_data');
        const meshElem = document.getElementById('space_mesh');

        if (spaceDataElem && spaceDataElem.textContent.trim().length) {
          this.space = JSON.parse(spaceDataElem.textContent);
        }

        if (tourDataElem && tourDataElem.textContent.trim().length) {
          this.tour = JSON.parse(tourDataElem.textContent);

        }

        if (orderedSpacesDataElem && orderedSpacesDataElem.textContent.trim().length) {
            this.spaces = JSON.parse(orderedSpacesDataElem.textContent);
            console.log("SPACES: ", this.spaces);

            // Get the first space in tour.tour_data.spaces and find the corresponding space from this.spaces
            if (this.tour
              && this.tour.tour_data
              && this.tour.tour_data.spaces
              && this.tour.tour_data.spaces.length > 0
              ) {
                const firstSpaceId = this.tour.tour_data.spaces[0].id.toString();
                this.space = this.spaces.find((space) => {
                  return (space.id.toString() === firstSpaceId);
                });
            }
        }
    }

    ensureDataShape() {
        if (!this.space) {
            console.warn('Space data not found in DOM, using example data for development.');
            this.space = { ...FALLBACK_SPACE };
        }

        if (this.space && !this.space.type) {
            this.space.type = 'spaces';
        }

        if (this.space && !this.space.space_data && this.space.nodes) {
            this.space = {
                type: this.space.type || 'spaces',
                space_data: this.space,
                version: this.space.version || null,
            };
        }

        if (this.tour && !this.tour.tour_data) {
            this.tour = { tour_data: this.tour };
        }

        if (!this.tour) {
            console.warn('Tour data not found in DOM; guided tour features disabled.');
        }
    }
}

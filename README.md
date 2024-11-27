# SPHR - SPatial Hackable Reality 


SPHR is an open-source virtual tour builder that enables the creation of hackable and customizable 3D spaces shared in web browsers. 

Built with Three.js, it allows you to build interactive virtual experiences with full control over the environment, transitions, and user interactions.



https://github.com/user-attachments/assets/cf189d3d-13ee-44d9-9cd5-b51df0e24d29



## In the wild

* [Tomb of Nefetari](https://mused.com/guided/923/the-tomb-of-nefertari-valley-of-the-queens/) - Basic
* [Garden dataset](https://spaces.mused.org/splattour0.3-en/index.html) - 3d Gaussian Splatting using [mkkellogg/GaussianSplats3D](https://github.com/mkkellogg/GaussianSplats3D)
* [Great Sphinx of Giza](https://mused.com/guided/438/great-sphinx/) - Matterport Integration
* [Tomb of Ramesses I](https://mused.com/tours/730/tomb-of-ramesses-i/) - More custom vfx
* [Museum of the Ancient Near East](https://mused.com/tours/964/assyrian-stele-harvard-museum-of-the-ancient-near-east/) - Custom vfx / video player

## Developer Note

I'm just extracting the frontend from my current implmentation and making some features more modular and hackable. More to come.


## Features
- Custom 3D space navigation and transitions
- Support for multiple viewing modes (First Person, Orbit)
- Integration with Matterport spaces
- Customizable tour points and annotations
- Mobile-responsive design
- Multi-language support


### 360 imagery 

Any sort of equirectangular 360 image can be used and displayed in the EnvCube component, but greater than 8k resolution is recommended. [EnvCube.js](https://github.com/lukehollis/sphr/blob/main/src/components/EnvCube.js)

There are two envCubes to support transition between the visible 360 image and the next that is navigated to. More on this in a later section.

In this implementation, to progressively load low-to-high resolution textures on the faces of the cube, I've used a IIIF image server for interoperability between projects. I'll remove this in future versions. 


### Cursor

One of the most essential pieces of this implementation is the cursor that renders on the 3d mesh of the space but appears on the top of the 360 images. This is where your users get the photorealistic 3d experience, interacting with the 3d mesh but viewing the 360 images.

You can see the current implementation here: [Cursor.js](https://github.com/lukehollis/sphr/blob/main/src/components/Cursor.js). There are many optimization to be made with the cursor, but it is currently functional as seen in the demos, and can be used as a starting point for your own custom cursor.


### Dollhouse 

The dollhouse is the low resolution version of a 3d capture of your space [Dollhouse.js](https://github.com/lukehollis/sphr/blob/main/src/components/Dollhouse.js)

It's used for cursor interactions and the Orbit view mode. I generally aim for less than 50k verts in my dollhouse and less than 2MB in texture size, but you can use much larger if it's important for you.


### Transition between 360 images w/CubeRenderTarget

This is a complex interaction that has little documentation in other place online--and one of the main reasons why I thought it would be useful to release this code. 

When navigating between two 360 images, the main camera lerps between the position of your first 360 image and second 360 image, and uses a [WebGLCubeRenderTarget](https://threejs.org/docs/#api/en/renderers/WebGLCubeRenderTarget) to render the transition onto the Environment Map of the Dollhouse to simulate movement between two points. 

This is an atypical custom use of the envMap, more here at (MeshBasicMaterial](https://threejs.org/docs/#api/en/materials/MeshBasicMaterial). The current implementation is memory inefficient and requires further work in custom shader development. 


### Models 

Unlike other tour builder software, this implementation offers a fully customizable scene graph to allow for changing between spaces and items in focus. You can customize this in the space and tour files in the next section.

You can see both [SceneGraph.js](https://github.com/lukehollis/sphr/blob/main/src/components/SceneGraph.js) for 3d models and [AnnotationGraph.js](https://github.com/lukehollis/sphr/blob/main/src/components/AnnotationGraph.js) for 2d annotations such as images and video embedded in your scenes.


### Spacefile / Building tours



### 3d Gaussian Splatting Support





## Building

Building for different languages:
You can build for a specific language by setting the LANG environment variable:

```bash
LANG=en npm run build  # for English
LANG=ar npm run build  # for Arabic
LANG=es npm run build  # for Spanish
```


## Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run start`
4. Build for production: `npm run build`

## Customization
The project is designed to be highly customizable. You can:
- Add custom scene effects and transitions
- Implement your own tour navigation logic
- Create custom UI components
- Extend the annotation system
- Add new language support

## License
MIT, but if this is useful to you, I request that you cite this repo because it helps the work continue.

```
@misc{hollis2024sphr,
  author = {Luke Hollis},
  title = {SPHR - Spatial Human Reality in a web browser},
  year = {2024},
  publisher = {GitHub},
  journal = {GitHub repository},
  howpublished = {\url{https://github.com/lukehollis/sphr}}
}
```

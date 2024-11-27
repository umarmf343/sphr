# SPHR - SPatial Human Reality 


SPHR is an open-source virtual tour builder that enables the creation of hackable and customizable 3D spaces shared in web browsers. 

Built with Three.js, it allows you to build interactive virtual experiences with full control over the environment, transitions, and user interactions.



https://github.com/user-attachments/assets/cf189d3d-13ee-44d9-9cd5-b51df0e24d29



## In the wild

* [Tomb of Nefetari](https://mused.com/guided/923/the-tomb-of-nefertari-valley-of-the-queens/) - Basic
* [Garden dataset](https://spaces.mused.org/splattour0.3-en/index.html) - 3d Gaussian Splatting using [mkkellogg/GaussianSplats3D](https://github.com/mkkellogg/GaussianSplats3D)
* [Great Sphinx of Giza](https://mused.com/guided/438/great-sphinx/) - Matterport Integration
* [Tomb of Ramesses I](https://mused.com/tours/730/tomb-of-ramesses-i/) - More custom vfx

## Developer Note

I'm just extracting the frontend from my current implmentation and making some features more modular and hackable. More to come.


## Features
- Custom 3D space navigation and transitions
- Support for multiple viewing modes (First Person, Orbit)
- Integration with Matterport spaces
- Customizable tour points and annotations
- Mobile-responsive design
- Multi-language support


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

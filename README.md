# ai-parser

## To allow data extraction from an Adobe Illustrator file (`some_file.ai`), please, follow the listed steps and specifications below :
[svg options screenshot](./svg_options.png "svg options")

## Export 
- Export to the **SVG format** (`some_file.svg`) using the following options (a screenshot is provided) :
    - Stylisation as attributes
    - no minification
    - not responsive

### Conventions
#### Toolkit 
- Must have a group name `colors`:
    - Must have subgroups, each :
        - Must be named `color`
        - Must include a text defining the color type (`colorType`), amongst (but not limited to) the following `Background, Cover, Font`.
        - Can include a colored rectangle using the desired color (for color picking purpose)

- Must have a group name `fonts`:
    - For each font declared, write a text **using the desired font**

- Must have a group name `images`:
    - Must have subgroups, each will have it's name used as the image name
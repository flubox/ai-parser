# ai-parser

## To allow data extraction from an Adobe Illustrator file (`some_file.ai`), please, follow the listed steps and specifications below :
[svg options screenshot](./svg_options.png "svg options")

## Export 
- Export to the **SVG format** (`some_file.svg`) using the following options (a screenshot is provided) :
    - Stylisation as attributes
    - no minification
    - not responsive

### Conventions for Toolkits
#### Group name convention, and why it matter
- Must include a group name `toolkits`: The parser will know to look after toolkits in the svg structure.
    - Each group named `toolkit`: The parser will parse each group as individual toolkit.
        
        - Each must have a group name `colors`: The parser will search for colors informations for this toolkit.
            - Each must include a text defining the color type (`colorType`), amongst (but not limited to) the following `background, cover, coverbackground, font` (in lowercase) : The parser will know the *colorType* of this color
            - Each must include a colored rectangle : The parser will know the RGB value of this color
        
        - Each must have a group name `fonts`: The parser will search for fonts informations for this toolkit.
            - For each font declared, write a text **using the desired font** : The parser will know the *font name* used by this writing.

        - Must have a group name `images`: The parser will search for images informations for this toolkit.
            - Must have subgroups, each will have it's name used as the image name
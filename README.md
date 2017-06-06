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
    
    - Each toolkit must be named `toolkit default the_toolkit_name`: The parser will parse each group as individual toolkit. The word `default` is non mandatory, and is used to indicate that the toolkit will include the default tookit. The  `the_toolkit_name` is the toolkit name. i.e: `toolkit default summer 2017` is the id of a `toolkit` including the `default` toolkit, named `summer 2017`.  
        
        - Each `toolkit` must have a group name `colors`: The parser will search for colors informations for this toolkit.  
            
            - Each `colors` group must include a text defining the color type (`colorType`), amongst (but not limited to) the following `background, cover, coverbackground, font` (in lowercase) : The parser will know the *colorType* of this color  
                
                - Each must include a colored rectangle : The parser will know the RGB value of this color  
        
            - Each `colors` group must have a group name `fonts`: The parser will search for fonts informations for this toolkit.  
                - For each font declared, write a text **using the desired font** : The parser will know the *font name* used by this writing.  

        - Each `color` group must have a group name `images`: The parser will search for images informations for this toolkit.               
            - Must have subgroups, each will have it's name used as the image name  

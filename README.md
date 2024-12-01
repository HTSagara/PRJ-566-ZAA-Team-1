<div align="center">

[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=500&size=47&letterSpacing=.2rem&pause=1000&color=CDCAC6&vCenter=true&width=456&height=104&lines=WordVision)](https://git.io/typing-svg)

</div>

### Table of Contents

1. [Overview](#overview)
2. [Technical Summary](#technical-summary)
3. [How To Use](#how-to-use)
   - [Login / Create an Account](#login--create-an-account)
   - [Home Page](#home-page)
     - [Upload a Book](#upload-a-book)
   - [Reading a Book](#reading-a-book)
   - [Create Highlight](#create-highlight)
   - [Visualize](#visualize)

## Overview

WordVision transforms the ePub reading experience by integrating AI-powered image generation directly within the text. Readers can highlight any passage to generate custom visuals, creating an immersive and personalized journey through the content.

## Technical Summary

- **Backend:** FastAPI powers the API for high-speed data handling.

- **Frontend:** Built with Expo React Native for smooth cross-platform mobile performance.

- **Integrations:** Utilizes Hugging Face Spaces for efficient AI image generation and Docker for consistent development environments.

- **Cloud & Database:** AWS Cognito handles secure user authentication, AWS S3 stores generated images and ePub files, and MongoDB organizes metadata, annotations, and user-generated content.

For more technical specifications and how to get started, go to [CONTRIBUTING.md](./CONTRIBUITING.md)

## How To Use

### Login / Create an Account

- Click on "Get Started" on the top right button
- You will be redirected the the user login page, where you can either login or create a new account

### Home Page

- In the **Home Page** you can access all of your books.
- If you don't have any book yet, go to [Upload a Book](#upload-a-book)

#### Upload a Book

- In the **Home** click on the **Upload a book** button on the top right.
- Select **Pick a file**
- Select a local `epub` file and click the **Upload** button

#### Reading a book

- Click on the book in your library and you will be redirected to the **Book Details** page
- Click on the **Read** button on the top right and start reading your book.

#### Create highlight

To create a highlight, select the text that you with to highlight and right click. It will display two options:

- **Highlight**: this option highlights the text for you, and will be save in the **Highlights Page** for future reference

- **Visualize**: this option highlights the text and generates an image based on the selected text.

#### Visualize

The **Visualize** feature lets you generate AI-powered custom visuals based on your selected text, enhancing your reading experience with immersive imagery.

**How it works:**

1. **Highlight the Text:** Select the passage or sentence you want to visualize and right-click to display the context menu.
2. **Choose "Visualize":** Click on the **Visualize** option. The system will:
   - Save the highlighted text for later reference.
   - Generate an AI-powered image representing the selected passage.
3. **View Generated Image:** Clicking on the highlight will show the generated image in a modal window. Here you can:
   - **Regenerate the Image:** Use the refresh icon beside the "Generated image" label to regenerate the visual with updated context.  
     ![image](https://github.com/user-attachments/assets/dfdf6a84-1252-40f9-87c1-72d34a7d5ab8)
   - **Regenerate using a custom text prompt:** Use the edit icon to bring up a modal that allows you to enter a prompt for generating the image.  
     ![image](https://github.com/user-attachments/assets/8cddc862-004f-44b8-b0cf-eb8cfa02133f)
   - **Delete the Image:** Use the delete icon to remove the image from the highlight.  
     ![image](https://github.com/user-attachments/assets/f52c0cf8-0b67-46fd-9300-791fcf91c0a6)
5. **Access Saved Highlights:** Navigate to the **Highlights Page** to review all previously generated visuals and highlights.

With **Visualize**, WordVision transforms text into engaging visuals, creating a more dynamic and personalized reading experience.

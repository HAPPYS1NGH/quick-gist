const vscode = require("vscode")
const axios = require("axios")
require("dotenv").config({ path: __dirname + "/.env.local" })

function activate(context) {
  console.log('Congratulations, your extension "short-gist" is now active!')

  // Register the "short-gist.helloWorld" command
  let helloWorldDisposable = vscode.commands.registerCommand(
    "short-gist.helloWorld",
    function () {
      vscode.window.showInformationMessage("Hello World from short-gist!")
    }
  )

  // Register the "short-gist.readFile" command
  let readFileDisposable = vscode.commands.registerCommand(
    "short-gist.readFile",
    async () => {
      // Get the active text editor
      const editor = vscode.window.activeTextEditor

      if (editor) {
        // Get the URI of the currently open file
        const fileUri = editor.document.uri

        try {
          // Read the content of the file
          const fileContent = await vscode.workspace.fs.readFile(fileUri)

          // Convert the buffer to a string (assuming it's a text file)
          const contentString = Buffer.from(fileContent).toString("utf-8")

          // Log the file content
          //   console.log(contentString)

          // Call the createGist function to create a Gist
          const gistURL = await createGist(contentString)
          console.log(gistURL)
          const url = await shortenUrl(gistURL)
          console.log(url)
          // Display a success message to the user
          vscode.window.showInformationMessage(
            "Gist created successfully!" + gistURL + "Shortened URL: " + url
          )
        } catch (error) {
          console.error("Error reading file:", error.message)
          // Display an error message to the user
          vscode.window.showErrorMessage(
            "Failed to read or create Gist. See the console for details."
          )
        }
      }
    }
  )

  // Push the disposables to the context.subscriptions array
  context.subscriptions.push(helloWorldDisposable, readFileDisposable)
}

// Deactivation hook
function deactivate() {}

// Register the "short-gist.createGist" command
const createGist = async (contentString) => {
  let gistURL = "https://happysingh.vercel.app/"

  return gistURL
}

async function shortenUrl(url) {
  const options = {
    method: "POST",
    url: "https://fast-url-shortener1.p.rapidapi.com/shorten",
    headers: {
      "content-type": "application/json",
      "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
      "X-RapidAPI-Host": "fast-url-shortener1.p.rapidapi.com",
    },
    data: {
      url: url,
    },
  }
  const response = await axios.request(options)
  console.log(response)
  return response.data.shortened
}

// Export the activate, deactivate, and createGist functions
module.exports = {
  activate,
  deactivate,
  createGist,
}

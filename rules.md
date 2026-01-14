# Reference Design Rules * Follow the architectural patterns and documentation standards found in the @child-letter workspace. * Use its README.md and any existing design artifacts as the 'Source of Truth' for the current build's thinking process.

Hanging Process Protocol:

If a browser verification or server startup task takes longer than 5 minutes without a successful connection, you must stop the process immediately.

Upon stopping, do not retry blindly. Instead, perform a Source Issue Review:

Check the Terminal logs for silent crashes or build errors.

Run netstat -aon | findstr :3000 to verify the port status.

Analyze the package.json and next.config.mjs for configuration mismatches.

Report the specific bottleneck to the user before proceeding with a new plan.
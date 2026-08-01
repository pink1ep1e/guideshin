module.exports = {
  apps: [
    {
      name: "guideshin",
      cwd: "/var/www/guideshin",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000 -H 127.0.0.1",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

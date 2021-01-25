import { Agent } from "identity-agent";

export const config = {
  // WARNING - for demo purposes only - do not pass AWS keys if using this on a browser in production
  awsAccessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
};

export const createAgent = () => Agent.register({ config }).build();

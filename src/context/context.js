import React, { useState, useEffect, createContext } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const gitHubContext = createContext();

const GitHubProvider = (props) => {
  const [gitHubUser, setGitHubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  const [requests, setRequests] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ show: false, msg: "" });

  const toggleError = (show = false, msg = "") => {
    setError({ show, msg });
  };

  const checkRequests = () => {
    axios
      .get(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;

        setRequests(remaining);

        if (remaining === 0) {
          toggleError(true, "Sorry,you have exceded your 60 mins rate limit");
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const searchGitHubUser = async (user) => {
    toggleError();
    setLoading(true);

    const response = await axios
      .get(`${rootUrl}/users/${user}`)
      .catch((error) => {
        console.log(error);
      });

    if (response) {
      setGitHubUser(response.data);
      const { login, followers_url } = response.data;

      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ])
        .then((results) => {
          const [repos, followers] = results;
          const status = "fulfilled";
          if (repos.status === status) {
            setRepos(repos.value.data);
          }
          if (followers.status === status) {
            setFollowers(followers.value.data);
          }
        })
        .catch((err) => console.log(err));
    } else {
      toggleError("true", "No user found");
    }
    checkRequests();
    setLoading(false);
  };
  useEffect(checkRequests, []);

  return (
    <gitHubContext.Provider
      value={{
        gitHubUser,
        requests,
        repos,
        followers,
        loading,
        error,
        setGitHubUser,
        searchGitHubUser,
      }}
    >
      {props.children}
    </gitHubContext.Provider>
  );
};

export { GitHubProvider, gitHubContext };

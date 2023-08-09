// ==UserScript==
// @name         Jira dev comments switch
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds switch to Jira Navigation to hide dev comments
// @author       Thomas
// @match        https://*.atlassian.net/jira/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const styling = `
    <style>

    :root {
    --dcs-red: 237, 20, 61;
    --dcs-blue: 100, 149, 237;
    }

    .dev-comment-switch {
    display: flex;
    align-items: center;
    padding-right: 8px;
    }

    .dev-comment-switch input[type=checkbox] {
    height: 0;
    width: 0;
    visibility: hidden;
    }

    body:after {
    --spread: 40vw;

    content: '';
    display: block;
    pointer-events: none;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 999;
    transition: box-shadow 0.2s;
    box-shadow: inset 0 0 var(--spread) rgba(var(--dcs-blue), 0.25);
    }

    body.dev-comment-switch-active:after {
    box-shadow: inset 0 0 var(--spread) rgba(var(--dcs-red), 0.5);
    }

    .dev-comment-switch label {
    --w: 48px;
    cursor: pointer;
    text-indent: -9999px;
    width: var(--w);
    padding: 4px;
    display: block;
    border-radius: 50rem;
    position: relative;
    background: rgb(var(--dcs-blue));
    box-shadow: 0 0 20px -2px rgba(var(--dcs-blue), 0.8);
    }

    .dev-comment-switch label:after {
    --dw: 24px;
    content: "";
    display: block;
    top: 4px;
    left: 4px;
    width: var(--dw);
    height: var(--dw);
    background: #fff;
    border-radius: 50rem;
    transition: 0.3s;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='cornflowerblue' viewBox='0 0 16 16'%3E%3Cpath d='M13.4 11.2C15 9.7 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.8.6l.8.8a6 6 0 0 1 2-.4c2.1 0 3.9 1.2 5.2 2.5a13.1 13.1 0 0 1 1.6 2s0 .2-.2.3a13.2 13.2 0 0 1-2 2.2l.8.7z'/%3E%3Cpath d='M11.3 9.2a3.5 3.5 0 0 0-4.5-4.5l.8.8a2.5 2.5 0 0 1 2.9 2.9l.8.8zm-3 1.3.9.8a3.5 3.5 0 0 1-4.5-4.5l.8.8a2.5 2.5 0 0 0 2.9 2.9z'/%3E%3Cpath d='m3.4 5.5-.6.5a13.1 13.1 0 0 0-1.6 2l.2.3L2.8 10c1.3 1.3 3 2.5 5.2 2.5a6 6 0 0 0 2-.4l.8.8a7 7 0 0 1-2.8.6C3 13.5 0 8 0 8s1-1.7 2.6-3.2l.7.7zm10.2 8.9-12-12 .8-.8 12 12-.8.8z'/%3E%3C/svg%3E");
    background-position: center;
    background-repeat: no-repeat;
    background-size: 16px 16px;
    }

    .dev-comment-switch input:checked + label {
    background: rgb(var(--dcs-red));
    box-shadow: 0 0 20px -2px rgba(var(--dcs-red), 0.8);
    }

    .dev-comment-switch input:checked + label:after {
    left: calc(100% - 4px);
    transform: translateX(calc(var(--w) - 100%));
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='crimson' viewBox='0 0 16 16'%3E%3Cpath d='M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.2 8a13.1 13.1 0 0 1 1.6-2c1.3-1.3 3-2.5 5.2-2.5 2.1 0 3.9 1.2 5.2 2.5a13.1 13.1 0 0 1 1.6 2s0 .2-.2.3L13.2 10A7.5 7.5 0 0 1 8 12.5 7.5 7.5 0 0 1 2.8 10a13.1 13.1 0 0 1-1.6-2z'/%3E%3Cpath d='M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z'/%3E%3C/svg%3E");
    }

    body:not(.dev-comment-switch-active) [data-test-id="issue.activity.comments-list"] > div:has([data-testid="issue-comment-base.ui.comment.grid-content-container"]) {
        height: 0;
        overflow: hidden;
        border-top: 2px solid rgb(var(--red));
        width: 100px;
    }
    </style>
    `;

    document
        .querySelector('head')
        .insertAdjacentHTML('beforeend', styling);

    const bodyClass = 'dev-comment-switch-active';
    const navEl = document.querySelector('header nav');
    const storage_key = 'dcs';
    let dcs_state = JSON.parse(localStorage.getItem(storage_key));

    const set_dcs__state = (state) => {
        dcs_state = state;
        localStorage.setItem(storage_key, state);
        if (state) document.body.classList.add(bodyClass);
        else document.body.classList.remove(bodyClass);

        console.log(state);
    };

    if (dcs_state === null) {
        console.log('not existing, set dcs state initially');
        set_dcs__state(false);
    }

    if (navEl) {


        const inputEl = document.createElement('input');
        inputEl.setAttribute('type', 'checkbox');
        inputEl.setAttribute('id', 'dev-comment-switch');
        inputEl.checked = dcs_state;
        inputEl.addEventListener('click', (e) => set_dcs__state(e.target.checked));

        const labelEl = document.createElement('label');
        labelEl.setAttribute('for', 'dev-comment-switch');

        const containerEl = document.createElement('div');
        containerEl.classList.add('dev-comment-switch');
        containerEl.appendChild(inputEl);
        containerEl.appendChild(labelEl);
        navEl.appendChild(containerEl);

        set_dcs__state(dcs_state);
    }
})();
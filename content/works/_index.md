---
title: Works
cascade:
  - target:
      kind: page
      path: /works/conference/**
    build:
      render: never
      list: always
  - target:
      kind: page
      path: /works/report/**
    build:
      render: never
      list: always
  - target:
      path: /works/**
      kind: page
    layout: work
---

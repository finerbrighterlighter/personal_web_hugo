---
title: Works
cascade:
  - _target:
      kind: page
      path: /works/conference/**
    build:
      render: never
      list: always
  - _target:
      kind: page
      path: /works/report/**
    build:
      render: never
      list: always
  - _target:
      path: /works/**
      kind: page
    layout: work
---

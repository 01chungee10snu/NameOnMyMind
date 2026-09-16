# G5 Korean Basic Dictionary pronunciation-audio rights HOLD

- Goal: **G5 — 50-card deploy-ready MVP**
- Affected research batch: `C0006–C0010` candidates (`서운하다`, `아쉽다`, `섭섭하다`, `뿌듯하다`, `뭉클하다`)
- Status: **HOLD — AUDIO NOT PRODUCT EVIDENCE**

## What is verified

1. Each target word has an authoritative Korean Basic Dictionary lexical entry.
2. The entry exposes a standard pronunciation form and an official MP3 pronunciation URL.
3. The five MP3 files were downloaded for local research only and SHA-256 hashed.
4. Independent Korean IPA provenance was cross-checked through Wiktionary's Korean pronunciation machinery/pages where available.
5. Korean scholarly sources support the semantic distinctiveness of these emotion adjectives, especially `아쉽다/섭섭하다/서운하다`, `뿌듯하다`, and `뭉클하다`.

## Why the rights gate is still HOLD

The Korean Basic Dictionary copyright policy says that ordinary site material is generally distributed under CC BY-SA 2.0 Korea, **but multimedia files including sound and pronunciation have commercial-use and modification permissions configured individually**.

The pronunciation block for these five headwords exposes the MP3 URL directly, but did not expose a file-level commercial-use/change permission or a linked multimedia identifier from which that exact permission could be read. The generic `viewSoundConfirm` rights screen exists, but the pronunciation link itself does not surface the required `multiMediaSeq` needed to bind the file to a specific rights record.

Therefore the project must not infer that these MP3 files inherit the general site license.

## Current action

- Keep the downloaded MP3s as **local research canaries only**.
- Do **not** register them in `content/approved/assets.json`.
- Do **not** mark C0006–C0010 `REVIEW_READY` while pronunciation-audio rights remain unresolved.
- Continue lexical, scholarly, IPA, distinctiveness, and cross-language research independently of this audio blocker.
- If exact file-level rights cannot be verified, use a separately licensed pronunciation source or keep the candidate on HOLD; do not lower the audio gate.

No publication permission, external release, or license inference is created by this artifact.

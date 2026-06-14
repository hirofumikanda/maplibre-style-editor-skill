# maplibre-style-editor-skill

MapLibre GL JS の `style.json` を [MapLibre Style Specification](https://maplibre.org/maplibre-style-spec/) に準拠しながら正確に編集するスキルです。

## 概要

**対応する操作：**

- レイヤー（`layers`）の追加・変更・削除
- ソース（`sources`）の追加・変更
- `paint` / `layout` プロパティの設定・変更
- `filter` の設定
- 表現式（expressions）の記述
- ルートプロパティ（`center`, `zoom`, `sprite`, `glyphs` など）の変更

**特徴：**

- 変更内容に応じて公式 Spec ページを参照し、プロパティ名・型・有効範囲を確認してから編集します
- `layout` / `paint` の区別、`enum` の有効値、排他制約など、よくある間違いを防止します（[CAUTIONS.md](skills/maplibre-style-editor/references/CAUTIONS.md) 参照）
- 表現式やプロパティ記法の推奨パターンをまとめた [BEST_PRACTICES.md](skills/maplibre-style-editor/references/BEST_PRACTICES.md) を活用します
- 編集後に `validate-style.js` で `style.json` のバリデーションが可能です

**使い方の例：**

```
建物レイヤーの fill-color を赤に変更して
circleレイヤーを新しく追加して
ズームレベルに応じて線の太さを変えたい
```

## ディレクトリ構成

```
.agents/
└── skills/
    └── maplibre-style-editor/
        ├── SKILL.md                  # スキル定義ファイル
        ├── references/
        │   ├── BEST_PRACTICES.md     # 表現式・プロパティ記法の推奨パターン
        │   └── CAUTIONS.md           # よくある間違いと注意事項
        └── scripts/
            └── validate-style.js     # style.json バリデーションスクリプト
```

## バリデーションスクリプトの使い方

`validate-style.js` を使って `style.json` が仕様に準拠しているか確認できます。

```bash
# 依存パッケージのインストール
npm install @maplibre/maplibre-gl-style-spec

# バリデーション実行
node .agents/skills/maplibre-style-editor/scripts/validate-style.js path/to/style.json
```

## 参考リンク

- [MapLibre Style Specification](https://maplibre.org/maplibre-style-spec/)

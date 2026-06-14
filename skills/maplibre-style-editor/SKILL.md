---
name: maplibre-style-editor
description: 'MapLibre GL JSのstyle.jsonを編集する。Use when: MapLibre style.json編集, スタイル変更, レイヤー追加, ソース追加, ペイントプロパティ変更, レイアウトプロパティ変更, フィルター設定, 表現式(expressions)記述, MapLibre Style Specification準拠, style.json, maplibre style, map styling, layer paint, layer layout.'
argument-hint: '編集内容を説明してください（例: "建物レイヤーの色を赤に変更"、"circleレイヤーを追加"）'
---

# MapLibre Style Editor

MapLibre GL JSの`style.json`をMapLibre Style Specificationに準拠しながら正確に編集するスキルです。

## Reference

- [ベストプラクティス](references/BEST_PRACTICES.md) — 式の選択・記法の推奨パターンをまとめたリファレンス。**表現式やプロパティを書く前に必ず参照すること。**
- [注意点](references/CAUTIONS.md) — `layout`/`paint` の区別・`source-layer` の制限・`sort-key` の挙動差異など、誤りやすい仕様をまとめたリファレンス。

## When to Use

- `style.json`のレイヤー（`layers`）を追加・変更・削除する
- ソース（`sources`）を追加・変更する
- `paint`/`layout`プロパティを設定・変更する
- `filter`を設定する
- 表現式（expressions）を記述する
- ルートプロパティ（`center`, `zoom`, `bearing`, `pitch`, `sprite`, `glyphs`など）を変更する

## Procedure

### Step 1: 編集対象の特定

まず対象ファイルを読み込み、編集箇所を特定する。

```
- 対象レイヤーのtypeを確認（fill / line / symbol / circle / heatmap / fill-extrusion / raster / hillshade / background）
- 変更するプロパティが layout か paint かを判断
- sourceおよびsource-layerの整合性を確認
```

### Step 2: Specを参照して正確な仕様を確認

**変更する内容に応じて、以下のSpecページを`fetch_webpage`で取得する。**

| 内容 | 参照URL |
|------|---------|
| ルートプロパティ | `https://maplibre.org/maplibre-style-spec/root/` |
| レイヤー全般 | `https://maplibre.org/maplibre-style-spec/layers/` |
| ソース | `https://maplibre.org/maplibre-style-spec/sources/` |
| 表現式（expressions） | `https://maplibre.org/maplibre-style-spec/expressions/` |
| 型定義 | `https://maplibre.org/maplibre-style-spec/types/` |
| スプライト | `https://maplibre.org/maplibre-style-spec/sprite/` |
| グリフ | `https://maplibre.org/maplibre-style-spec/glyphs/` |
| ライト | `https://maplibre.org/maplibre-style-spec/light/` |
| トランジション | `https://maplibre.org/maplibre-style-spec/transition/` |

**Spec参照時に確認する項目：**
- プロパティ名の正確なスペル（例: `fill-color` ✓, `fillColor` ✗）
- 値の型（`color`, `number`, `enum`, `boolean`, `array`など）
- 数値の有効範囲（例: `opacity` は `[0, 1]`）
- `enum`の場合は有効な選択肢の一覧
- `layout`プロパティか`paint`プロパティかの区別
- 必須の依存プロパティ（`Requires`制約）
- 排他的プロパティ（`Disabled by`制約）
- data-driven styling（feature-state, interpolate）が対応しているか

### Step 3: 表現式（Expressions）の検証

表現式を使う場合は `https://maplibre.org/maplibre-style-spec/expressions/` を参照し：

1. 式の構文が正しいか確認（`["operator", ...args]` 形式）
2. 型が一致しているか確認
3. よく使う式のパターン：
   - ズーム依存: `["interpolate", ["linear"], ["zoom"], zoom1, val1, zoom2, val2]`
   - データ駆動: `["get", "property_name"]`
   - 条件分岐: `["case", condition, value_if_true, value_if_false]`
   - 一致: `["match", ["get", "prop"], "val1", result1, "val2", result2, default]`
   - ステップ: `["step", ["zoom"], default, zoom1, val1, zoom2, val2]`

### Step 4: 編集を実施

Specで確認した仕様に基づき、ファイルを編集する。

**チェックリスト：**
- [ ] プロパティ名のスペルが正確
- [ ] 値の型が仕様と一致
- [ ] 数値が有効範囲内
- [ ] `enum`値が仕様の選択肢に含まれる
- [ ] `layout`と`paint`の区別が正しい
- [ ] 必須プロパティが揃っている（`id`, `type`は必須; `background`以外は`source`が必須）
- [ ] `source-layer`はvectorソースのみ指定（GeoJSONには不可）
- [ ] 依存関係・排他制約を満たしている
- [ ] `version: 8` がルートに存在する

### Step 5: バリデーション

編集後、`scripts/validate-style.js` を使ってスタイルを検証する。

`run_in_terminal` で以下を実行する（`<path>` は編集した style.json のパスに置き換える）：

```
node scripts/validate-style.js <path>
```

- `style.json is valid.` と表示されれば成功
- エラーが出た場合はエラー内容を確認して修正し、再度実行して `valid` になるまで繰り返す

> **注意**: スクリプトはESモジュール形式のため、実行ディレクトリに `"type": "module"` を含む `package.json` が必要。存在しない場合はファイル名を `.mjs` に変更するか、`node --input-type=module` フラグを使うこと。

### Step 6: 確認

バリデーション通過後に以下を確認する：

1. レイヤーの描画順序が意図通りか（配列の順序 = 描画順序）
2. 参照するsource IDが`sources`に存在するか
3. スプライトを使う場合、`sprite`ルートプロパティが設定されているか

## 重要な仕様メモ

### レイヤーtypeと主要プロパティ

| type | 主なlayoutプロパティ | 主なpaintプロパティ |
|------|---------------------|-------------------|
| `background` | `visibility` | `background-color`, `background-opacity`, `background-pattern` |
| `fill` | `visibility`, `fill-sort-key` | `fill-color`, `fill-opacity`, `fill-outline-color`, `fill-pattern` |
| `line` | `visibility`, `line-cap`, `line-join` | `line-color`, `line-width`, `line-opacity`, `line-dasharray` |
| `symbol` | `text-field`, `text-font`, `text-size`, `icon-image`, `icon-size` | `text-color`, `text-halo-color`, `icon-color`, `icon-opacity` |
| `circle` | `visibility`, `circle-sort-key` | `circle-radius`, `circle-color`, `circle-opacity`, `circle-stroke-width` |
| `heatmap` | `visibility` | `heatmap-radius`, `heatmap-weight`, `heatmap-color`, `heatmap-opacity` |
| `fill-extrusion` | `visibility` | `fill-extrusion-color`, `fill-extrusion-height`, `fill-extrusion-base` |
| `raster` | `visibility` | `raster-opacity`, `raster-brightness-min`, `raster-saturation` |
| `hillshade` | `visibility` | `hillshade-exaggeration`, `hillshade-shadow-color` |

### ソースtype

| type | 用途 | 主な必須プロパティ |
|------|------|------------------|
| `vector` | ベクタータイル | `tiles` or `url` |
| `raster` | ラスタータイル | `tiles` or `url` |
| `geojson` | GeoJSONデータ | `data` |
| `image` | 画像オーバーレイ | `url`, `coordinates` |
| `video` | 動画オーバーレイ | `urls`, `coordinates` |
| `raster-dem` | 標高タイル | `tiles` or `url` |

### よくある間違い

- `fill-color` を `layout` に書く（→ `paint` に書くべき）
- `text-field` を `paint` に書く（→ `layout` に書くべき）
- `opacity` の範囲を `[0, 100]` と思い込む（→ `[0, 1]`）
- GeoJSONソースに `source-layer` を指定する（→ vectorのみ）
- `line-dasharray` を `line-pattern` と同時に使う（→ 排他）
- `fill-outline-color` を `fill-pattern` と同時に使う（→ 排他）

## Spec参照のタイミング

不明な点や迷う点があれば、**必ず`fetch_webpage`でSpecを参照してから編集する**。記憶に頼らずSpecを確認することで誤りを防ぐ。

- 仕様ページのトップ: `https://maplibre.org/maplibre-style-spec/`
- 特定セクション: 上記URLテーブルを参照

# MapLibre Style ベストプラクティス

MapLibre Style Specificationに準拠したスタイルを記述する際のベストプラクティスをまとめたリファレンスドキュメントです。

注意点（`layout`/`paint` の区別・`source-layer` の制限・挙動の違いなど）は [CAUTIONS.md](CAUTIONS.md) を参照。

---

## 1. プロパティ値の参照：`["get", ...]` を使う

フィーチャーのプロパティを参照する場合は、必ず `["get", "property_name"]` 形式の式を使う。  
旧来の `{property_name}` 記法（レガシー）は非推奨であり、MapLibre GL JSでは動作しない場合がある。

```jsonc
// NG: 非推奨（Mapbox GL JS レガシー記法）
"text-field": "{name}"

// OK: 正しい式
"text-field": ["get", "name"]
```

ネストしたプロパティや計算を組み合わせる場合も `get` を基点にする。

```jsonc
// 文字列の連結
"text-field": ["concat", ["get", "name"], " (", ["get", "type"], ")"]

// 型変換
"text-field": ["to-string", ["get", "population"]]
```

---

## 2. 離散値の分岐：`case` より `match` を使う

入力値が特定の値と一致するかどうかで出力を切り替える場合は `match` を使う。  
`case` は汎用的な条件分岐であり、等値比較には冗長で読みにくくなる。

```jsonc
// NG: case による等値比較（冗長）
"circle-color": [
  "case",
  ["==", ["get", "type"], "A"], "#ff0000",
  ["==", ["get", "type"], "B"], "#00ff00",
  ["==", ["get", "type"], "C"], "#0000ff",
  "#888888"
]

// OK: match による等値マッチング（シンプル・高効率）
"circle-color": [
  "match", ["get", "type"],
  "A", "#ff0000",
  "B", "#00ff00",
  "C", "#0000ff",
  "#888888"
]
```

複数の値を同じ出力にまとめることも可能

```jsonc
"circle-color": [
  "match", ["get", "type"],
  ["A", "B"], "#ff0000",
  ["C", "D"], "#0000ff",
  "#888888"
]
```

**使い分け：**

| 状況 | 推奨 |
|------|------|
| 値が特定の定数と一致するか | `match` |
| 複数の任意条件（不等号・`has`・`in`など）を組み合わせる | `case` |

---

## 3. 数値レンジへの対応：`case` より `step` を使う

ズームレベルやプロパティ値の「閾値で段階的に変化する」出力を表現するには `step` を使う。  
`case` で比較演算子を並べるより、意図が明確で記述量も少ない。

```jsonc
// NG: case による閾値比較（冗長・保守困難）
"line-width": [
  "case",
  ["<", ["zoom"], 10], 1,
  ["<", ["zoom"], 14], 3,
  ["<", ["zoom"], 18], 5,
  7
]

// OK: step による段階的変化（簡潔）
"line-width": [
  "step", ["zoom"],
  1,     // zoom < 10 のデフォルト
  10, 3, // zoom >= 10
  14, 5, // zoom >= 14
  18, 7  // zoom >= 18
]
```

プロパティ値に対しても同様に使える

```jsonc
"circle-radius": [
  "step", ["get", "population"],
  4,          // population < 1000
  1000,  8,   // population >= 1000
  10000, 12,  // population >= 10000
  50000, 18   // population >= 50000
]
```

**使い分け：**

| 状況 | 推奨 |
|------|------|
| 入力の閾値で出力が段階的に変化する | `step` |
| 入力に応じて出力が連続的に変化する（補間） | `interpolate` |
| 閾値が不規則な任意条件 | `case` |

---

## 4. 連続値の変化：`step` より `interpolate` を使う

ズームやプロパティ値に応じてなめらかに変化させるには `interpolate` を使う。

```jsonc
// OK: ズームに応じた線形補間
"line-width": [
  "interpolate", ["linear"], ["zoom"],
  10, 1,
  18, 8
]

// 指数曲線で変化させる（地図らしい拡大感）
"line-width": [
  "interpolate", ["exponential", 1.5], ["zoom"],
  10, 1,
  18, 8
]
```

カラーの補間は `interpolate` でのみ可能（`step` はカラー補間に対応しない）

```jsonc
"fill-color": [
  "interpolate", ["linear"], ["get", "density"],
  0,    "#f7fbff",
  100,  "#6baed6",
  1000, "#08306b"
]
```

---

## 5. カラー指定：CSS 色名より `rgba` / 16進数を使う

`rgba` や `#RRGGBB` 形式を使うと透明度も一元管理でき、ツールとの互換性も高い。

```jsonc
// 使用可能だが曖昧
"fill-color": "red"

// 推奨: 16進数
"fill-color": "#ff0000"

// 透明度が必要な場合: rgba
"fill-color": "rgba(255, 0, 0, 0.5)"

// または fill-opacity を分離して管理
"fill-color": "#ff0000",
"fill-opacity": 0.5
```

---

## 6. レイヤーの `visibility`：不要なレイヤーを削除しない

一時的に非表示にしたい場合は `visibility: "none"` を使う。  
レイヤーを完全削除すると設定が失われ、後から復元しにくい。

```jsonc
"layout": {
  "visibility": "none"  // 非表示（"visible" で再表示）
}
```


---

## 7. コメント・注釈：`metadata` を使う

MapLibre Style の JSON にはコメントを書けない。意図や注釈はレイヤー・ソース・スタイルルートの `metadata` プロパティに任意のキーで記録する。  
`metadata` はレンダリングに影響せず、ツールや開発者向けの情報として安全に保持できる。

```json
{
  "id": "road-label",
  "type": "symbol",
  "metadata": {
    "comment": "道路名ラベル。zoom 10 以上で表示。フォントは必ずグリフ配信済みのものを使うこと。",
    "author": "map-team",
    "last-updated": "2026-06-14"
  },
  "minzoom": 10,
  "layout": {
    "text-field": ["get", "name"]
  }
}
```

スタイルルートに全体の注釈を付ける場合も同様：

```json
{
  "version": 8,
  "metadata": {
    "comment": "本番用スタイル。変更前に validate-style.js で検証すること。"
  },
  "layers": []
}
```

**注意：** `metadata` の値は MapLibre によって無視されるが、第三者ツール（Maputnik など）が独自キーを書き込む場合がある。衝突を避けるため、カスタムキーにはプレフィックスを付けることを推奨する（例: `"myorg:comment"`）。

---

## 8. ラインのアウトライン：アウトラインレイヤー ＋ `line-gap-width` を使う

道路などのラインにアウトライン（縁取り）を付ける場合は、単一レイヤーの `line-offset` で代替しようとせず、  
**アウトライン用レイヤーを別途追加し、アウトラインレイヤー側に `line-gap-width` を設定する**方法を取る。

### `line-gap-width` の意味

`line-gap-width` はラインの実際のパスの**外側**にケーシング（縁取り）を描画するプロパティで、  
「内側のギャップ幅」つまり**本体レイヤーの `line-width` と同じ値**を設定することで、  
ケーシングが本体にぴったり隣接して描画される。

### 構造

```
[アウトラインレイヤー]  ← 下に配置（line-gap-width = 本体の line-width, line-width = ケーシングの片側幅）
[本体レイヤー]         ← 上に配置（通常の line-width のみ）
```

### 例：道路レイヤーにアウトラインを付ける

```json
[
  {
    "id": "road-outline",
    "type": "line",
    "source": "my-vector",
    "source-layer": "road",
    "layout": {
      "line-cap": "round",
      "line-join": "round"
    },
    "paint": {
      "line-color": "#888888",
      "line-gap-width": 6,
      "line-width": 2
    }
  },
  {
    "id": "road-fill",
    "type": "line",
    "source": "my-vector",
    "source-layer": "road",
    "layout": {
      "line-cap": "round",
      "line-join": "round"
    },
    "paint": {
      "line-color": "#ffffff",
      "line-width": 6
    }
  }
]
```

> `road-outline` を `road-fill` より先（下）に配置することで、アウトラインが本体の背後に描画される。  
> `road-outline` の `line-gap-width: 6` = `road-fill` の `line-width: 6`（内側のギャップ幅と本体幅を一致させる）。

### ズームに応じて幅を連動させる場合

`line-gap-width` の値を本体の `line-width` と連動させる

```json
{
  "id": "road-outline",
  "paint": {
    "line-color": "#888888",
    "line-gap-width": ["interpolate", ["linear"], ["zoom"], 10, 2, 18, 8],
    "line-width": 2
  }
},
{
  "id": "road-fill",
  "paint": {
    "line-color": "#ffffff",
    "line-width": ["interpolate", ["linear"], ["zoom"], 10, 2, 18, 8]
  }
}
```

アウトラインの `line-width`（片側幅）は 1〜3px 程度を目安にする。

### NG パターン①：単一レイヤーで `line-offset` を使う

```json
// NG: offset で擬似アウトラインを再現しようとする（結合部・端点が崩れる）
{
  "id": "road-outline",
  "paint": {
    "line-color": "#888888",
    "line-width": 2,
    "line-offset": 4
  }
}
```

`line-offset` はラインを平行移動するだけであり、コーナーや端点の処理が意図通りにならない。

### NG パターン②：アウトラインレイヤーの `line-width` を本体より太くして下に敷く

```json
// NG: line-width だけで太いラインを下に敷いてアウトラインに見せる
[
  {
    "id": "road-outline",
    "paint": {
      "line-color": "#888888",
      "line-width": 10
    }
  },
  {
    "id": "road-fill",
    "paint": {
      "line-color": "#ffffff",
      "line-width": 6
    }
  }
]
```

一見アウトラインのように見えるが、`line-cap`・`line-join` の設定によってはコーナーや端点の形状がずれる。  
また、`line-width` の差分でアウトライン幅を管理するため、幅の調整が直感的でなく保守しにくい。  
`line-gap-width` を使えばアウトライン幅（`line-width`）と内側のギャップ幅（`line-gap-width`）を独立して管理でき、意図が明確になる。

アウトライン表現には必ず `line-gap-width` を持つ専用のアウトラインレイヤーを使うこと。


---

## 表現式クイックリファレンス

| 目的 | 式 |
|------|-----|
| プロパティ値を取得 | `["get", "prop"]` |
| プロパティの存在確認 | `["has", "prop"]` |
| 値の一致分岐 | `["match", input, val, out, ..., default]` |
| 閾値で段階変化 | `["step", input, default, threshold, out, ...]` |
| 連続補間 | `["interpolate", ["linear"], input, stop, val, ...]` |
| 汎用条件分岐 | `["case", condition, out, ..., default]` |
| 論理AND | `["all", expr1, expr2, ...]` |
| 論理OR | `["any", expr1, expr2, ...]` |
| 否定 | `["!", expr]` |
| 文字列連結 | `["concat", str1, str2, ...]` |
| 型変換（文字列） | `["to-string", expr]` |
| ズーム値 | `["zoom"]` |
| 画面解像度 | `["resolution"]` |
| feature-state 取得 | `["feature-state", "key"]` |

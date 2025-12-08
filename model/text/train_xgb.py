import joblib
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import f1_score, accuracy_score


X_COLS = None # will set after load
TARGET = 'Type'




def train_xgb(df):
X = df.drop(columns=[TARGET,'id','timestamp'], errors='ignore')
y = df[TARGET]


# for tree models convert categoricals to one-hot or label-encode
X = pd.get_dummies(X, columns=['Location','Character','DPF'], dummy_na=True)


global X_COLS
X_COLS = X.columns.tolist()


skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
models = []
oof = pd.Series(index=df.index, dtype=float)


for fold, (train_idx, val_idx) in enumerate(skf.split(X,y)):
dtrain = xgb.DMatrix(X.iloc[train_idx], label=y.iloc[train_idx])
dval = xgb.DMatrix(X.iloc[val_idx], label=y.iloc[val_idx])
params = {
'objective':'multi:softprob',
'num_class': len(y.unique()),
'eval_metric':'mlogloss',
'eta':0.05,
'max_depth':6,
'subsample':0.8,
'colsample_bytree':0.8,
'seed':42
}
bst = xgb.train(params, dtrain, num_boost_round=1000, evals=[(dval,'valid')], early_stopping_rounds=50, verbose_eval=False)
models.append(bst)
proba = bst.predict(dval)
preds = proba.argmax(axis=1)
oof.iloc[val_idx] = preds
print(f'Fold {fold} accuracy:', (preds == y.iloc[val_idx]).mean())


joblib.dump(models, 'artifacts/xgb_models.joblib')
joblib.dump(X_COLS, 'artifacts/xgb_cols.joblib')


print('XGBoost models trained and saved')




if __name__=='__main__':
df = pd.read_parquet('data/processed.parquet')
train_xgb(df)
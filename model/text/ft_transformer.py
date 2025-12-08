import torch
x = self.transformer(x)
cls_out = x[0] # (batch, dim)
out = self.head(cls_out)
return out


# training wrapper


def train_ft(df, epochs=30, batch_size=64, lr=1e-3):
# choose numeric and categorical columns
NUMERIC = ['Age','Duration','Frequency','Intensity','Intensity_x_Freq']
CATEGORICAL = ['Location','Character','DPF']
TARGET = 'Type'


# prepare inputs
X_num = df[NUMERIC].values.astype(np.float32)


cat_arrays = []
cat_dims = []
for c in CATEGORICAL:
le = LabelEncoder()
arr = le.fit_transform(df[c].astype(str))
cat_arrays.append(arr)
cat_dims.append(int(arr.max())+1)
joblib.dump(le, f'artifacts/le_{c}.joblib')


X_cat = np.stack(cat_arrays, axis=1)
y = df[TARGET].values


dataset = TabularDataset(X_num, X_cat, y)
loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)


model = FTTransformer(n_num=X_num.shape[1], cat_dims=cat_dims, out_dim=len(np.unique(y)))
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model.to(device)


opt = torch.optim.AdamW(model.parameters(), lr=lr)
loss_fn = nn.CrossEntropyLoss()


for ep in range(epochs):
model.train()
total = 0
correct = 0
for batch in loader:
num = batch['num'].to(device)
cat = batch['cat'].to(device)
yb = batch['y'].to(device)
logits = model(num, cat)
loss = loss_fn(logits, yb)
opt.zero_grad()
loss.backward()
opt.step()
preds = logits.argmax(dim=1)
total += yb.size(0)
correct += (preds==yb).sum().item()
print(f'Epoch {ep} acc {correct/total:.4f}')


torch.save(model.state_dict(), 'artifacts/ft_transformer.pth')
print('Saved FT-Transformer')




if __name__=='__main__':
df = pd.read_parquet('data/processed.parquet')
train_ft(df)
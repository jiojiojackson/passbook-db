# passbook

## Project setup
```
npm install -g @vue/cli  
vue create password-manager  
cd password-manager
```

# database table
## passwords
CREATE TABLE "passwords" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER,
  "url" VARCHAR(255),
  "username" VARCHAR(255),
  "password" VARCHAR(255),
  "remarks" VARCHAR(255)
);



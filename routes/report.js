const { getPool } = require("../db/connection");
module.exports=function(requireAuth){
  const express=require("express"); const router=express.Router();
  router.get("/sample-report", requireAuth, async (req,res)=>{
    const pool=await getPool();
    const q=`
      SELECT TOP (10)
        o.OrderID, o.OrderDate,
        p.ProductName, od.Quantity, od.UnitPrice
      FROM dbo.Orders o
      JOIN dbo.[Order Details] od ON o.OrderID = od.OrderID
      JOIN dbo.Products p ON od.ProductID = p.ProductID
      ORDER BY o.OrderDate DESC;`;
    const result=await pool.request().query(q);
    res.json(result.recordset);
  });
  return router;
};

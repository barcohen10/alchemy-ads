
module.exports = {
   intersection: function(a,b) {
     const fields = {};
     
     a.forEach(field => {
        fields[field] = 0;
     });
     b.forEach(field => {
        if(fields[field] === 0) {
           fields[field]++;
        }
     });
     return Object.keys(fields)
            .filter(key => fields[key] > 0)
            .map(item => Number(item));
  }
};

 


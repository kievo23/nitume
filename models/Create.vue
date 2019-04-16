<template>
  <div class="card w-50" id="newasset">
    <strong class="mb-9 mp-4 pt-3 text-primary">Create TPS</strong>
    <div class="card-body">
      <form>
        <div class="form-group">
          <label for="name">Name:</label>
          <input type="text" class="form-control" id="name" v-model.lazy="name" name="name" v-validate="'required:true|min:2'">
          <div class="help-block alert alert-danger" v-show="errors.has('name')">{{errors.first('name')}}</div>
        </div>
        <div class="form-group">
          <label for="alias">Alias:</label>
          <input type="text" class="form-control" id="alias" v-model.lazy="alias" name="alias" v-validate="'required:true|min:1'">
          <div class="help-block alert alert-danger" v-show="errors.has('alias')">{{errors.first('alias')}}</div>
        </div>
        <div class="form-group">
          <label for="location">location:</label>
          <input type="text" class="form-control" id="location" v-model.lazy="location" name="location" v-validate="'required:true|min:3'">
          <div class="help-block alert alert-danger" v-show="errors.has('location')">{{errors.first('location')}}</div>
        </div>
        <div class="form-group">
          <label for="address">Address:</label>
          <input type="text" class="form-control" id="address" v-model.lazy="address" name="address" v-validate="'required:true|min:3'">
          <div class="help-block alert alert-danger" v-show="errors.has('address')">{{errors.first('address')}}</div>
        </div>
        <div class="form-group">
          <label for="phone">Phone No.:</label>
          <input type="text" class="form-control" id="phone" v-model.lazy="phone" name="phone" v-validate="'required:true|min:3'">
          <div class="help-block alert alert-danger" v-show="errors.has('phone')">{{errors.first('phone')}}</div>
        </div>
        <div class="form-group">
          <label for="valuation">TPS type:</label>
          <select name='type' class='form-control' v-model.lazy='type'>
            <option selected>--select Type--</option>
            <option value='1'>Under Development</option>
            <option value='2'>Developed</option>
          </select>
        </div>
        <div class="form-group">
          <label for="description">Description:</label>
          <textarea class="form-control" id="description" v-model.lazy="description" name="description" v-validate="'required:true|min:3'"></textarea>
          <div class="help-block alert alert-danger" v-show="errors.has('description')">{{errors.first('description')}}</div>
        </div>

        <button class="btn btn-primary form-control" v-on:click.prevent="createTps">Create</button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CreateTps',
  data() {
    return {
        name: '',
        alias: '',
        location: '',
        address: '',
        phone: '',
        status: '',
        type: 1,
        description: ''
    };
  },
  computed: {
    token(){
      return this.$store.state.token;
    },
    isAuth(){
      return this.$store.state.isAuth;
    },
    tps() {
      return this.$store.state.tps ;
    },
    assettypes() {
      return this.$store.state.assettypes ;
    },
  },
  created() {
    this.$store.dispatch('fetchAssetTypes');
    this.$store.dispatch('fetchTps');
  },
  methods: {
    createTps: function(){
      let tps = {
        name: this.name,
        alias: this.alias,
        location: this.location,
        address: this.address,
        phone: this.phone,
        type: this.type,
        description: this.description
      };
      //console.log(user);
      this.$validator.validateAll().then(valid => {
        if(valid){
          console.log(this.token);
          this.$http.post('tps' , tps, { headers: { 'Authorization': "bearer " + this.token }})
          .then(response => {
            // JSON responses are automatically parsed.
            //console.log(response.status);
            if(response.status == 201){
              this.$swal.fire({
                type: 'success',
                title: 'Your work has been saved',
                showConfirmButton: false,
                timer: 1500
              }).then(rst => {
                this.$router.push({name: 'Tps'});
              });
            }
            //this.posts = response.data
          })
          .catch(e => {
            console.log(e.response);
            this.$toast.error({
                title:'Error',
                message:e.response.data.msg
            });
            if(e.response.status == 401){
              this.$router.push({name: 'Login'});
            }else{

            }

            //this.errors.push(e);
          })
        }
      });
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
#newasset{
  margin: 0 auto;
  margin-top:50px;
}
</style>
